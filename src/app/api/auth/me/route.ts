import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/auth'
import { rateLimit } from '@/lib/security'

/**
 * GET /api/auth/me
 * 현재 로그인한 사용자 정보 조회
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult
  try {
    const supabase = await createClient()
    
    // 현재 사용자 세션 가져오기
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 사용자 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        bio,
        role,
        created_at,
        updated_at
      `)
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      // 프로필이 없는 경우 기본 사용자 정보만 반환
      return NextResponse.json({
        id: session.user.id,
        email: session.user.email,
        username: session.user.email?.split('@')[0] || 'user',
        display_name: null,
        avatar_url: null,
        bio: null,
        role: 'user',
        created_at: session.user.created_at,
        updated_at: session.user.created_at
      })
    }

    // 사용자 정보와 프로필 결합
    const user = {
      ...profile,
      email: session.user.email,
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}