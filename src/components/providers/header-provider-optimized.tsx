'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/ui/header'
import type { User } from '@/types/auth'

export function HeaderProvider() {
  const [user, setUser] = useState<Pick<User, 'id' | 'email' | 'username' | 'role'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  // 프로필 가져오기 함수
  const fetchProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', userId)
        .maybeSingle()

      if (profile) {
        return {
          id: userId,
          email: email,
          username: profile.username,
          role: profile.role
        }
      } else {
        // 프로필이 없으면 기본값 사용
        return {
          id: userId,
          email: email,
          username: email.split('@')[0] || 'user',
          role: 'user' as const
        }
      }
    } catch (error) {
      console.error('프로필 가져오기 오류:', error)
      return {
        id: userId,
        email: email,
        username: email.split('@')[0] || 'user',
        role: 'user' as const
      }
    }
  }, [supabase])

  useEffect(() => {
    let mounted = true

    // 초기 세션 확인
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (session?.user) {
          const userProfile = await fetchProfile(session.user.id, session.user.email || '')
          if (mounted) {
            setUser(userProfile)
          }
        }
      } catch (error) {
        console.error('초기 인증 오류:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // 세션 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_IN' && session?.user) {
        const userProfile = await fetchProfile(session.user.id, session.user.email || '')
        setUser(userProfile)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      
      setLoading(false)
    })

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  return <Header user={user || undefined} loading={loading} />
}