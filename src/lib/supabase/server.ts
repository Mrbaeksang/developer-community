import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions: CookieOptions = {
                ...options,
                // Supabase 쿠키는 클라이언트에서도 접근 가능해야 함
                httpOnly: options?.httpOnly ?? false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: options?.maxAge || 60 * 60 * 24 * 7,
              }
              
              // 개발 환경에서만 디버그 로그
              if (process.env.NODE_ENV === 'development') {
                console.log(`[Supabase] Setting cookie: ${name}`, {
                  valueLength: value?.length,
                  options: cookieOptions
                })
              }
              
              cookieStore.set(name, value, cookieOptions)
            })
          } catch (error) {
            // 서버 컴포넌트에서는 쿠키 설정이 불가능할 수 있음
            if (process.env.NODE_ENV === 'development') {
              console.error('[Supabase] Cookie setting error:', error)
            }
          }
        },
      },
    }
  )
}

// 세션 검증 헬퍼 함수
export async function validateSession() {
  const supabase = await createClient()
  
  try {
    // 먼저 getSession으로 캐시된 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('[Supabase] Session error:', sessionError)
      return { session: null, user: null }
    }
    
    if (!session) {
      return { session: null, user: null }
    }
    
    // 세션 만료 확인
    const expiresAt = new Date(session.expires_at! * 1000)
    const now = new Date()
    
    if (expiresAt <= now) {
      console.log('[Supabase] Session expired, attempting refresh')
      // 세션이 만료되었으면 리프레시 시도
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !newSession) {
        console.error('[Supabase] Session refresh failed:', refreshError)
        return { session: null, user: null }
      }
      
      return { session: newSession, user: newSession.user }
    }
    
    // 세션이 유효하면 getUser 호출 (신중하게)
    // 너무 자주 호출하면 rate limit에 걸릴 수 있음
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      // 네트워크 오류나 일시적 오류인 경우 세션은 유지
      console.error('[Supabase] User validation error:', userError)
      
      // 401 에러인 경우에만 세션 무효화
      if (userError.status === 401) {
        return { session: null, user: null }
      }
      
      // 다른 에러는 세션 정보로 대체
      return { session, user: session.user }
    }
    
    return { session, user: user || session.user }
  } catch (error) {
    console.error('[Supabase] Session validation error:', error)
    return { session: null, user: null }
  }
}