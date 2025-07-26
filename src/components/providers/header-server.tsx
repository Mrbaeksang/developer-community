import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { Header } from '@/components/ui/header'
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
              cookieStore.set(name, value, options)
            })
          } catch {
            // 서버 컴포넌트에서는 쿠키 설정이 제한적
          }
        },
      },
    }
  )

  try {
    // 세션 확인
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      return null
    }

    // 프로필 정보 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', session.user.id)
      .single()

    if (profile) {
      return {
        id: session.user.id,
        email: session.user.email || '',
        username: profile.username,
        role: profile.role
      }
    }

    // 프로필이 없으면 기본값 반환
    return {
      id: session.user.id,
      email: session.user.email || '',
      username: session.user.email?.split('@')[0] || 'user',
      role: 'user'
    }
  } catch (error) {
    console.error('Server auth check error:', error)
    return null
  }
}

export async function HeaderServer() {
  const user = await getServerUser()
  
  return <Header user={user || undefined} loading={false} />
}