// Supabase 클라이언트 설정
export const supabaseConfig = {
  auth: {
    // 세션 관련 설정 - Supabase 표준 쿠키 사용
    persistSession: true,
    // storageKey 제거 - Supabase 기본값 사용
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // 세션 만료 시간 설정 (초 단위)
    flowType: 'pkce' as const,
    // 리프레시 토큰 자동 갱신 간격 (5분 전)
    refreshThreshold: 300,
  },
  // 쿠키 옵션
  cookies: {
    lifetime: 60 * 60 * 24 * 7, // 7일
    domain: '',
    path: '/',
    sameSite: 'lax' as const,
  },
  // 실시간 설정
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
}

// 세션 리프레시 헬퍼
export async function ensureValidSession(supabase: ReturnType<typeof import('./client').createClient>) {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session) {
    return null
  }
  
  // 세션 만료 확인
  const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
  const now = new Date()
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
  
  // 5분 이내에 만료될 예정이면 리프레시
  if (expiresAt && expiresAt < fiveMinutesFromNow) {
    const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) {
      console.error('Session refresh failed:', refreshError)
      return null
    }
    return newSession
  }
  
  return session
}