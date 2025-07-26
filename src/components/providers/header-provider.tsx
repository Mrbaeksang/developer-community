'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/ui/header'
import type { User } from '@/types/auth'

interface HeaderProviderProps {
  initialUser?: Pick<User, 'id' | 'email' | 'username' | 'role'> | null
}

export function HeaderProvider({ initialUser }: HeaderProviderProps) {
  // 서버에서 전달된 초기 상태 사용
  const [user, setUser] = useState<Pick<User, 'id' | 'email' | 'username' | 'role'> | null>(initialUser || null)
  const [loading, setLoading] = useState(false) // 서버에서 이미 로드했으므로 false
  
  console.log('HeaderProvider 렌더링, 현재 user 상태:', user, 'loading:', loading)
  
  const supabase = createClient()

  useEffect(() => {
    console.log('HeaderProvider useEffect 시작')
    let isMounted = true
    
    // 서버에서 초기값을 받았으면 localStorage 체크 불필요
    if (!initialUser && typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('header-user')
        if (storedUser) {
          const parsed = JSON.parse(storedUser)
          // 1시간 이내의 데이터만 사용
          if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
            console.log('HeaderProvider: 로컬 스토리지에서 사용자 정보 복원')
            setUser(parsed.user)
          }
        }
      } catch (e) {
        console.error('localStorage 파싱 에러:', e)
      }
    }
    
    // 항상 클라이언트에서도 세션 확인 (서버와 클라이언트 상태 동기화)
    const checkSession = true
    
    // 현재 세션 확인 - 개선된 순차 처리
    const getSession = async () => {
      if (!checkSession) {
        // 서버에서 이미 확인했으므로 건너뛰기
        return
      }
      
      try {
        // 1. 먼저 로컬 세션 확인 및 리프레시
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!isMounted) return
        
        // 세션이 없거나 에러가 있으면 즉시 처리
        if (sessionError || !session?.user) {
          console.log('No valid session found')
          setUser(null)
          setLoading(false)
          localStorage.removeItem('header-user')
          return
        }
        
        // 2. 세션이 만료되었는지 확인하고 필요시 리프레시
        const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
        const now = new Date()
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
        
        // 5분 이내에 만료될 예정이면 미리 리프레시
        if (expiresAt && expiresAt < fiveMinutesFromNow) {
          console.log('Session will expire soon, attempting refresh...')
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError || !refreshedSession) {
            console.error('Session refresh failed:', refreshError)
            // 리프레시 실패해도 현재 세션이 아직 유효하면 계속 사용
            if (expiresAt > now) {
              console.log('Session still valid, continuing...')
            } else {
              setUser(null)
              setLoading(false)
              localStorage.removeItem('header-user')
              return
            }
          }
        }
        
        // 3. 유효한 세션이 있으면 사용자 정보 설정
        const authUser = session.user
        
        // 인증된 사용자가 있으면 프로필 정보 가져오기
        try {
          
          // 프로필 정보 가져오기
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', authUser.id)
            .single()

          if (error) {
            console.error('프로필 조회 에러:', error)
            // 에러가 발생해도 기본 사용자 정보는 설정
            setUser({
              id: authUser.id,
              email: authUser.email || '',
              username: authUser.email?.split('@')[0] || 'user',
              role: 'user'
            })
          } else if (profile) {
            const userData = {
              id: authUser.id,
              email: authUser.email || '',
              username: profile.username,
              role: profile.role
            }
            setUser(userData)
            // localStorage에 사용자 정보 저장
            if (typeof window !== 'undefined') {
              localStorage.setItem('header-user', JSON.stringify({
                user: userData,
                timestamp: Date.now()
              }))
            }
          } else if (!error || (error as { code?: string }).code === 'PGRST116') {
            // 프로필이 없으면 생성
            const username = authUser.email?.split('@')[0] || 'user'
            
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert([{
                id: authUser.id,
                username: username,
                display_name: username,
                role: 'user'
              }])
              .select('username, role')
              .single()

            if (newProfile) {
              const userData = {
                id: authUser.id,
                email: authUser.email || '',
                username: newProfile.username,
                role: newProfile.role
              }
              setUser(userData)
              // localStorage에 사용자 정보 저장
              if (typeof window !== 'undefined') {
                localStorage.setItem('header-user', JSON.stringify({
                  user: userData,
                  timestamp: Date.now()
                }))
              }
            }
          }
        } catch (err) {
          // 초기 프로필 조회 예외 처리
          console.error('프로필 조회 중 오류:', err)
        }
      } catch (err) {
        console.error('세션 조회 중 오류:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getSession()
    
    // 초기 상태가 없을 때만 타임아웃 설정
    let timeoutId: NodeJS.Timeout | null = null
    if (!initialUser && checkSession) {
      timeoutId = setTimeout(() => {
        if (loading && isMounted) {
          console.warn('HeaderProvider: 세션 확인 타임아웃')
          setUser(null)
          setLoading(false)
        }
      }, 10000)
    }

    // 인증 상태 변경 감지 - 개선된 이벤트 처리
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (!isMounted) return
      
      // 로그아웃 처리
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
        // 로그아웃 시 localStorage 정리
        if (typeof window !== 'undefined') {
          localStorage.removeItem('header-user')
        }
        return
      }
      
      // 토큰 리프레시 성공 시 처리
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
        // 세션이 리프레시되었으므로 계속 유지
        return
      }
      
      if (session?.user) {
        try {
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', session.user.id)
            .single()


          if (error) {
            console.error('프로필 조회 에러 (onAuthStateChange):', error)
            // 에러가 발생해도 기본 사용자 정보는 설정
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.email?.split('@')[0] || 'user',
              role: 'user'
            })
          } else if (profile) {
            const userData = {
              id: session.user.id,
              email: session.user.email || '',
              username: profile.username,
              role: profile.role
            }
            setUser(userData)
            // localStorage에 사용자 정보 저장
            if (typeof window !== 'undefined') {
              localStorage.setItem('header-user', JSON.stringify({
                user: userData,
                timestamp: Date.now()
              }))
            }
          } else if (!error || (error as { code?: string }).code === 'PGRST116') {
            // 프로필이 없으면 생성
            const username = session.user.email?.split('@')[0] || 'user'
            
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert([{
                id: session.user.id,
                username: username,
                display_name: username,
                role: 'user'
              }])
              .select('username, role')
              .single()


            if (newProfile) {
              const userData = {
                id: session.user.id,
                email: session.user.email || '',
                username: newProfile.username,
                role: newProfile.role
              }
              setUser(userData)
              // localStorage에 사용자 정보 저장
              if (typeof window !== 'undefined') {
                localStorage.setItem('header-user', JSON.stringify({
                  user: userData,
                  timestamp: Date.now()
                }))
              }
            }
          }
        } catch {
          // 프로필 조회 예외 처리
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [supabase, initialUser])

  // 로딩 중에도 헤더 표시 - 로딩이 끝나면 버튼이 보여야 함
  return <Header user={user || undefined} loading={loading} />
}