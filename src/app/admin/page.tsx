import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Activity,
  Eye
} from 'lucide-react'

// 임시 통계 데이터
const stats = [
  {
    title: '전체 사용자',
    value: '80',
    description: '활성 사용자 75명',
    icon: Users,
    trend: '+5%'
  },
  {
    title: '블로그 포스트',
    value: '124',
    description: '이번 주 12개 작성',
    icon: FileText,
    trend: '+12%'
  },
  {
    title: '댓글',
    value: '892',
    description: '오늘 45개',
    icon: MessageSquare,
    trend: '+8%'
  },
  {
    title: '페이지 뷰',
    value: '15.2K',
    description: '이번 달',
    icon: Eye,
    trend: '+23%'
  }
]

const recentActivities = [
  {
    id: 1,
    type: 'post',
    user: 'admin',
    action: '새 블로그 포스트 작성',
    target: 'GPT-5 출시 임박: AI의 새로운 지평',
    time: '10분 전'
  },
  {
    id: 2,
    type: 'comment',
    user: 'user123',
    action: '댓글 작성',
    target: 'Next.js 15의 혁신적인 기능들',
    time: '25분 전'
  },
  {
    id: 3,
    type: 'team',
    user: 'system',
    action: '팀 로테이션 완료',
    target: '4개 팀 재편성',
    time: '1시간 전'
  },
  {
    id: 4,
    type: 'user',
    user: 'newuser',
    action: '새 사용자 가입',
    target: 'newuser@example.com',
    time: '2시간 전'
  }
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">
          커뮤니티 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
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

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <CardDescription>
            커뮤니티의 최근 활동 내역
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 빠른 작업 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">블로그 포스트 작성</CardTitle>
            <CardDescription>새로운 AI 뉴스나 기술 트렌드 작성</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">팀 로테이션 시작</CardTitle>
            <CardDescription>새로운 팀 편성 프로세스 시작</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">사용자 관리</CardTitle>
            <CardDescription>사용자 권한 및 상태 관리</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}