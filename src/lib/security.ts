import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CsrfProtection, requireCsrfToken } from '@/lib/csrf'
import { ApiResponseBuilder } from '@/lib/api-response'
import type { User } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // 60 requests per minute

// In-memory rate limiting (production should use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()

  const current = requestCounts.get(key)
  
  if (!current || current.resetTime < now) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return null
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((current.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(current.resetTime)
        }
      }
    )
  }

  current.count++
  return null
}

// Input validation helpers
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 10000) // Limit length
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Authorization helpers
export async function requireAuth(request: NextRequest): Promise<{ user: User } | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  return { user }
}

export async function requireAdmin(request: NextRequest): Promise<{ supabase: SupabaseClient<Database>, user: User } | NextResponse> {
  try {
    const supabase = await createClient()
    
    // 먼저 세션 확인 (빠른 응답)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('[requireAdmin] Session error:', sessionError)
      return NextResponse.json(
        { error: 'Session error', details: sessionError.message },
        { status: 401 }
      )
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', details: 'No active session' },
        { status: 401 }
      )
    }
    
    // 세션이 있으면 사용자 검증
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('[requireAdmin] User validation error:', userError)
      return NextResponse.json(
        { error: 'User validation failed', details: userError?.message || 'No user found' },
        { status: 401 }
      )
    }
    
    // 프로필에서 역할 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[requireAdmin] Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Profile fetch failed', details: profileError.message },
        { status: 500 }
      )
    }
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', role: profile?.role || 'none' },
        { status: 403 }
      )
    }

    // 성공 시 supabase 클라이언트와 user 정보 반환
    return { supabase, user }
  } catch (error) {
    console.error('[requireAdmin] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// CORS configuration for specific endpoints
export function setCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  return response
}

// SQL injection protection for raw queries
export function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}

// XSS protection for user-generated content
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char)
}