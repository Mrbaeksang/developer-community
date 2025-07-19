import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, MessageSquare, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// 임시 팀 데이터
const currentTeam = {
  id: '1',
  name: '팀 알파',
  rotationNumber: 3,
  startDate: '2025-01-15',
  endDate: '2025-01-29',
  members: [
    { id: '1', name: '김개발', role: 'Frontend', avatar: '/api/placeholder/40/40' },
    { id: '2', name: '이백엔드', role: 'Backend', avatar: '/api/placeholder/40/40' },
    { id: '3', name: '박풀스택', role: 'Fullstack', avatar: '/api/placeholder/40/40' },
    { id: '4', name: '최데브옵스', role: 'DevOps', avatar: '/api/placeholder/40/40' }
  ],
  stats: {
    tasksCompleted: 12,
    messagesCount: 156,
    memosCount: 8
  }
}

const previousTeams = [
  {
    id: '2',
    name: '팀 베타',
    rotationNumber: 2,
    period: '2025.01.01 - 2025.01.14',
    tasksCompleted: 18
  },
  {
    id: '3',
    name: '팀 감마',
    rotationNumber: 1,
    period: '2024.12.15 - 2024.12.31',
    tasksCompleted: 15
  }
]

export default function TeamsPage() {
  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">팀 대시보드</h1>
        <p className="text-muted-foreground">
          현재 소속된 팀 정보와 협업 도구
        </p>
      </div>

      {/* 현재 팀 정보 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{currentTeam.name}</CardTitle>
              <CardDescription>
                로테이션 #{currentTeam.rotationNumber} • {currentTeam.startDate} ~ {currentTeam.endDate}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              <Calendar className="mr-1 h-3 w-3" />
              D-10
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* 팀 멤버 */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                팀 멤버
              </h3>
              <div className="space-y-3">
                {currentTeam.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 팀 통계 */}
            <div>
              <h3 className="font-semibold mb-4">팀 활동</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">완료된 태스크</span>
                  <span className="font-semibold">{currentTeam.stats.tasksCompleted}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">채팅 메시지</span>
                  <span className="font-semibold">{currentTeam.stats.messagesCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">팀 메모</span>
                  <span className="font-semibold">{currentTeam.stats.memosCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/teams/${currentTeam.id}/chat`}>
                <MessageSquare className="mr-2 h-4 w-4" />
                팀 채팅
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/teams/${currentTeam.id}/memos`}>
                팀 메모
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tasks">
                태스크 보드
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 이전 팀 히스토리 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">이전 팀 히스토리</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {previousTeams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <CardDescription>
                  로테이션 #{team.rotationNumber} • {team.period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    완료 태스크: {team.tasksCompleted}개
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/teams/history/${team.id}`}>
                      상세 보기
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}