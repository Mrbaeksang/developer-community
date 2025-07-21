'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/ui/header'
import { User } from '@supabase/supabase-js'

interface AppUser {
  id: string
  email: string
  username: string
  role?: string
}

export function HeaderProvider() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 현재 세션 확인
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        try {
          
          // 프로필 정보 가져오기
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', session.user.id)
            .single()


          if (error) {
            // 초기 프로필 조회 에러 처리
          }

          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              username: profile.username,
              role: profile.role
            })
          } else if (!error || error.code === 'PGRST116') {
            // 프로필이 없으면 생성
            const username = session.user.email?.split('@')[0] || 'user'
            
            const { data: newProfile, error: createError } = await supabase
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
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                username: newProfile.username,
                role: newProfile.role
              })
            }
          }
        } catch (err) {
          // 초기 프로필 조회 예외 처리
        }
      }
      setLoading(false)
    }

    getSession()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (session?.user) {
        try {
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', session.user.id)
            .single()


          if (error) {
            // 프로필 조회 에러 처리
          }

          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              username: profile.username,
              role: profile.role
            })
          } else if (!error || error.code === 'PGRST116') {
            // 프로필이 없으면 생성
            const username = session.user.email?.split('@')[0] || 'user'
            
            const { data: newProfile, error: createError } = await supabase
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
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                username: newProfile.username,
                role: newProfile.role
              })
            }
          }
        } catch (err) {
          // 프로필 조회 예외 처리
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="font-bold text-xl">Dev Community</div>
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        </div>
      </header>
    )
  }

  return <Header user={user || undefined} />
}