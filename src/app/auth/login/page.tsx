'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // 입력값 검증
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      setIsLoading(false)
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.')
      setIsLoading(false)
      return
    }

    try {
      // 로그인 시도
      console.log('로그인 시도:', { 
        email, 
        passwordLength: password.length,
        timestamp: new Date().toISOString()
      })
      
      // Supabase URL 확인
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      // 로그인 응답 처리
      console.log('로그인 응답:', { 
        success: !!data?.user,
        error: error,
        errorMessage: error?.message,
        errorStatus: error?.status,
        errorCode: error?.code,
        user: data?.user?.email 
      })

      if (error) {
        console.error('로그인 에러 상세:', error)
        throw error
      }

      if (data.user) {
        // 로그인 성공
        console.log('로그인 성공')
        
        // 세션 확인
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('세션 확인:', {
          hasSession: !!sessionData.session,
          userId: sessionData.session?.user?.id,
          expiresAt: sessionData.session?.expires_at
        })
        
        // 쿠키 확인
        console.log('현재 쿠키:', document.cookie)
        
        // 약간의 지연 후 리다이렉트 (쿠키 설정 시간 확보)
        setTimeout(() => {
          console.log('리다이렉트 전 쿠키:', document.cookie)
          window.location.href = '/'
        }, 100)
      }
    } catch (err: unknown) {
      // 로그인 에러 처리
      console.error('로그인 실패:', err)
      
      // Supabase 에러 메시지 처리
      const error = err as { message?: string; status?: number }
      if (error?.message === 'Invalid login credentials') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else if (error?.message === 'Email not confirmed') {
        setError('이메일 인증이 필요합니다. 이메일을 확인해주세요.')
      } else if (error?.status === 400) {
        setError('로그인 정보를 다시 확인해주세요.')
      } else {
        setError(error?.message || '로그인에 실패했습니다.')
      }
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            로그인
          </CardTitle>
          <CardDescription className="text-center">
            이메일과 비밀번호를 입력하세요
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                회원가입
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}