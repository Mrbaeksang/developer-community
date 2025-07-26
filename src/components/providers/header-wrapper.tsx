import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { HeaderProvider } from './header-provider'
import type { User } from '@/types/auth'

async function getServerUser(): Promise<Pick<User, 'id' | 'email' | 'username' | 'role'> | null> {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
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
              cookieStore.set(name, value, {
                ...options,
                httpOnly: options?.httpOnly ?? false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              })
            })
          } catch {
            // 서버 컴포넌트에서는 쿠키 설정이 제한적
          }
        },
      },
    }
  )

  try {
    // 세션 확인 - 더 안전한 getUser 사용
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    
    if (error || !authUser) {
      return null
    }

    // 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      return {
        id: authUser.id,
        email: authUser.email || '',
        username: profile.username,
        role: profile.role
      }
    }

    // 프로필이 없으면 기본값 반환
    return {
      id: authUser.id,
      email: authUser.email || '',
      username: authUser.email?.split('@')[0] || 'user',
      role: 'user'
    }
  } catch (error) {
    console.error('Server auth check error:', error)
    return null
  }
}

// 서버 컴포넌트
export async function HeaderWrapper() {
  const user = await getServerUser()
  
  // 클라이언트 컴포넌트에 초기 사용자 정보 전달
  return <HeaderProvider initialUser={user} />
}