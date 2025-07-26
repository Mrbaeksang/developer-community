// Supabase 디버그 유틸리티
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export const SUPABASE_DEBUG = process.env.NEXT_PUBLIC_SUPABASE_DEBUG === 'true'

export function debugLog(context: string, data: unknown) {
  if (SUPABASE_DEBUG) {
    console.log(`[Supabase ${context}]`, {
      timestamp: new Date().toISOString(),
      ...data
    })
  }
}

// 쿠키 디버그 헬퍼
export function debugCookies() {
  if (typeof window !== 'undefined' && SUPABASE_DEBUG) {
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
      const [name, value] = cookie.split('=')
      acc[name] = value
      return acc
    }, {} as Record<string, string>)
    
    console.log('[Cookie Debug]', {
      all: cookies,
      supabase: Object.entries(cookies).filter(([key]) => key.includes('sb-')),
      timestamp: new Date().toISOString()
    })
  }
}

// 세션 상태 디버그
export async function debugSessionState(supabase: SupabaseClient<Database>) {
  if (!SUPABASE_DEBUG) return
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('[Session Debug]', {
      hasSession: !!session,
      hasUser: !!user,
      sessionUserId: session?.user?.id,
      userId: user?.id,
      sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Session Debug Error]', error)
  }
}