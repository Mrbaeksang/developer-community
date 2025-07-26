'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutPage() {
  const router = useRouter()
  const [status, setStatus] = useState('로그아웃 중...')
  const supabase = createClient()

  useEffect(() => {
    const logout = async () => {
      try {
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.error('로그아웃 에러:', error)
          setStatus('로그아웃 실패: ' + error.message)
        } else {
          setStatus('로그아웃 완료! 로그인 페이지로 이동합니다...')
          
          // 쿠키가 완전히 제거될 때까지 대기
          setTimeout(() => {
            window.location.href = '/auth/login'
          }, 1000)
        }
      } catch (err) {
        console.error('로그아웃 중 오류:', err)
        setStatus('로그아웃 중 오류가 발생했습니다.')
      }
    }

    logout()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">로그아웃</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}