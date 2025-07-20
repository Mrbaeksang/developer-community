'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { 
  ArrowLeft, 
  Search, 
  MoreHorizontal,
  User,
  Users,
  Shield,
  Activity,
  Mail,
  Calendar,
  Ban,
  UserCheck,
  Edit
} from 'lucide-react'

// 임시 멤버 데이터
const membersData = [
  {
    id: '1',
    name: '김개발',
    email: 'kim@example.com',
    role: 'user',
    team: '팀 알파',
    joinedAt: '2025-01-01',
    lastLoginAt: '2025-01-20T10:30:00Z',
    status: 'active',
    stats: {
      posts: 5,
      tasks: 23,
      messages: 145
    }
  },
  {
    id: '2',
    name: '이코딩',
    email: 'lee@example.com',
    role: 'user',
    team: '팀 알파',
    joinedAt: '2025-01-01',
    lastLoginAt: '2025-01-20T09:15:00Z',
    status: 'active',
    stats: {
      posts: 3,
      tasks: 18,
      messages: 98
    }
  },
  {
    id: '3',
    name: '박프로',
    email: 'park@example.com',
    role: 'admin',
    team: '팀 알파',
    joinedAt: '2024-12-15',
    lastLoginAt: '2025-01-20T11:00:00Z',
    status: 'active',
    stats: {
      posts: 12,
      tasks: 45,
      messages: 234
    }
  },
  {
    id: '4',
    name: '최배포',
    email: 'choi@example.com',
    role: 'user',
    team: '팀 알파',
    joinedAt: '2025-01-05',
    lastLoginAt: '2025-01-19T14:20:00Z',
    status: 'inactive',
    stats: {
      posts: 1,
      tasks: 8,
      messages: 34
    }
  }
]

export default function TeamMembersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [members] = useState(membersData)

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.team.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeMembers = members.filter(m => m.status === 'active').length
  const adminCount = members.filter(m => m.role === 'admin').length

  return (
    <div className="container py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            관리자 대시보드로
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">멤버 관리</h1>
            <p className="text-muted-foreground">
              부트캠프 멤버를 관리하고 활동을 모니터링하세요
            </p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 멤버</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              등록된 사용자
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 멤버</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              최근 7일 내 로그인
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">관리자</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground">
              관리 권한 보유
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 활동</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(members.reduce((sum, m) => sum + m.stats.tasks, 0) / members.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              완료 태스크/인
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름, 이메일, 팀으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 멤버 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>멤버 목록</CardTitle>
          <CardDescription>
            총 {filteredMembers.length}명의 멤버
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>멤버</TableHead>
                <TableHead>팀</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>마지막 로그인</TableHead>
                <TableHead>활동</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.team}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role === 'admin' ? '관리자' : '일반'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.joinedAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>
                    {new Date(member.lastLoginAt).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>포스트: {member.stats.posts}</div>
                      <div>태스크: {member.stats.tasks}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={member.status === 'active' ? 'default' : 'outline'}
                      className={member.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {member.status === 'active' ? '활성' : '비활성'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>작업</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          정보 수정
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          메시지 보내기
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          팀 변경
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {member.role === 'user' ? (
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            관리자 권한 부여
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            일반 권한으로 변경
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600">
                          <Ban className="mr-2 h-4 w-4" />
                          계정 비활성화
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}