'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Activity,
  Eye,
  Loader2,
  TestTube2
} from 'lucide-react'
import Link from 'next/link'
import type { AdminStats } from '@/types/admin'

interface AdminActivity {
  id: string
  type: string
  user: string
  action: string
  target: string
  time: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // 통계 데이터와 활동 로그를 병렬로 조회
        const [statsResponse, activitiesResponse] = await Promise.all([
          fetch('/api/admin/stats', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          }),
          fetch('/api/admin/activities', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          })
        ])

        if (!statsResponse.ok) {
          throw new Error('통계 데이터 조회 실패')
        }
        
        // 활동 로그 응답 처리
        let activitiesData = []
        if (!activitiesResponse.ok) {
          console.error('활동 로그 API 응답:', activitiesResponse.status, activitiesResponse.statusText)
          // 에러가 있어도 계속 진행 (빈 배열 사용)
          try {
            const errorData = await activitiesResponse.json()
            console.error('활동 로그 에러 상세:', errorData)
          } catch (e) {
            console.error('활동 로그 응답 파싱 실패')
          }
        } else {
          try {
            const data = await activitiesResponse.json()
            // 배열인지 확인
            activitiesData = Array.isArray(data) ? data : []
          } catch (e) {
            console.warn('활동 로그 응답 파싱 실패, 빈 배열로 처리')
            activitiesData = []
          }
        }

        const statsData = await statsResponse.json()

        setStats(statsData)
        setActivities(activitiesData)
      } catch (err) {
        console.error('대시보드 데이터 조회 에러:', err)
        setError(err instanceof Error ? err.message : '데이터 조회에 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // 통계 카드 데이터 구성 - null 체크 추가
  const statsCards = stats && stats.overview ? [
    {
      title: '전체 사용자',
      value: (stats.overview.total_users || 0).toString(),
      description: `등록된 전체 회원 수`,
      icon: Users,
      trend: stats.overview.total_users > 0 ? '+' : ''
    },
    {
      title: '승인된 게시글',
      value: (stats.overview.total_posts || 0).toString(),
      description: '관리자 승인 완료',
      icon: FileText,
      trend: stats.overview.total_posts > 0 ? '+' : ''
    },
    {
      title: '전체 커뮤니티',
      value: (stats.overview.total_communities || 0).toString(),
      description: '활성 커뮤니티 수',
      icon: MessageSquare,
      trend: stats.overview.total_communities > 0 ? '+' : ''
    },
    {
      title: '시스템 상태',
      value: '정상',
      description: '모든 서비스 정상 운영',
      icon: Eye,
      trend: '✓'
    }
  ] : [
    // stats가 없는 경우 기본값 표시
    {
      title: '전체 사용자',
      value: '-',
      description: '데이터 로딩 중',
      icon: Users,
      trend: ''
    },
    {
      title: '승인된 게시글',
      value: '-',
      description: '데이터 로딩 중',
      icon: FileText,
      trend: ''
    },
    {
      title: '전체 커뮤니티',
      value: '-',
      description: '데이터 로딩 중',
      icon: MessageSquare,
      trend: ''
    },
    {
      title: '시스템 상태',
      value: '확인 중',
      description: '상태 확인 중',
      icon: Eye,
      trend: '...'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">대시보드 로딩 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <p className="text-muted-foreground">
          커뮤니티 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 실시간 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  <span className="flex items-center text-xs text-green-600">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {stat.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 실시간 활동 로그 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 관리자 활동</CardTitle>
          <CardDescription>
            시스템 관리 활동 내역 (실시간)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        <span className="font-semibold">{activity.user}</span>
                        {' '}{activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.target}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>아직 관리자 활동이 없습니다.</p>
                <p className="text-xs mt-1">관리 작업을 수행하면 여기에 표시됩니다.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 빠른 작업 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/posts/pending">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">게시글 승인 관리</CardTitle>
              <CardDescription>대기 중인 게시글 검토 및 승인</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/admin/categories">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">카테고리 관리</CardTitle>
              <CardDescription>게시글 카테고리 추가 및 관리</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">사용자 관리</CardTitle>
            <CardDescription>사용자 권한 및 상태 관리</CardDescription>
          </CardHeader>
        </Card>
        
        <Link href="/admin/api-test-center">
          <Card className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg text-blue-900 dark:text-blue-100">API 테스트 센터</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">시스템 API 종합 테스트 및 진단</CardDescription>
              </div>
              <TestTube2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}