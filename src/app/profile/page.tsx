'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Calendar, Shield } from 'lucide-react'

interface Profile {
  id: string
  username: string
  display_name: string
  email: string
  role: string
  avatar_url?: string
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push('/auth/login')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error

        setProfile({
          ...data,
          email: session.user.email || ''
        })
      } catch (error) {
        console.error('프로필 로드 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <p className="text-center text-gray-500">프로필을 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">내 프로필</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>프로필 정보</CardTitle>
          <CardDescription>
            회원 가입일: {new Date(profile.created_at).toLocaleDateString('ko-KR')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center mb-8">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">이메일</Label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="username">사용자명</Label>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-gray-400" />
                <Input
                  id="username"
                  value={profile.username}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="display_name">표시 이름</Label>
              <Input
                id="display_name"
                value={profile.display_name}
                disabled
                className="bg-gray-50"
              />
            </div>
            
            <div>
              <Label htmlFor="role">권한</Label>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="w-4 h-4 text-gray-400" />
                <Input
                  id="role"
                  value={profile.role === 'admin' ? '관리자' : '일반 사용자'}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6 flex gap-4">
            <Button variant="outline" onClick={() => router.push('/')}>
              메인으로
            </Button>
            <Button variant="outline" onClick={() => router.push('/write')}>
              글쓰기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}