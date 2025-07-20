'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Calendar,
  Shuffle,
  Play,
  CheckCircle,
  Clock,
  Edit,
  User
} from 'lucide-react'

// 임시 로테이션 데이터
const rotationsData = [
  {
    id: '3',
    week: 3,
    startDate: '2025-01-15',
    endDate: '2025-01-22',
    status: 'active',
    teams: [
      {
        id: '1',
        name: '팀 알파',
        members: ['김개발', '이코딩', '박프로', '최배포']
      },
      {
        id: '2',
        name: '팀 베타',
        members: ['정디버그', '강테스트', '윤리팩터', '임커밋']
      },
      {
        id: '3',
        name: '팀 감마',
        members: ['한배포', '서도커', '남깃헙', '송쿠버']
      }
    ]
  },
  {
    id: '2',
    week: 2,
    startDate: '2025-01-08',
    endDate: '2025-01-15',
    status: 'completed',
    teams: [
      {
        id: '1',
        name: '팀 알파',
        members: ['김개발', '정디버그', '남깃헙', '송쿠버']
      },
      {
        id: '2',
        name: '팀 베타',
        members: ['이코딩', '강테스트', '한배포', '임커밋']
      },
      {
        id: '3',
        name: '팀 감마',
        members: ['박프로', '윤리팩터', '서도커', '최배포']
      }
    ]
  }
]

// 전체 멤버 목록
const allMembers = [
  '김개발', '이코딩', '박프로', '최배포',
  '정디버그', '강테스트', '윤리팩터', '임커밋',
  '한배포', '서도커', '남깃헙', '송쿠버',
  '조프론트', '차백엔드', '탁풀스택', '민데브옵스'
]

export default function TeamRotationsPage() {
  const [selectedRotation, setSelectedRotation] = useState(rotationsData[0])
  const [isCreating, setIsCreating] = useState(false)

  const handleShuffle = () => {
    // 팀 멤버 셔플 로직
    const shuffled = [...allMembers].sort(() => Math.random() - 0.5)
    const teamSize = Math.ceil(shuffled.length / 3)
    
    console.log('팀 재배정:', {
      '팀 알파': shuffled.slice(0, teamSize),
      '팀 베타': shuffled.slice(teamSize, teamSize * 2),
      '팀 감마': shuffled.slice(teamSize * 2)
    })
  }

  const handleActivate = () => {
    console.log('로테이션 활성화')
  }

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
            <h1 className="text-3xl font-bold mb-2">팀 로테이션 관리</h1>
            <p className="text-muted-foreground">
              주차별 팀 구성을 관리하고 로테이션을 설정하세요
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            새 로테이션
          </Button>
        </div>
      </div>

      {/* 현재 로테이션 상태 */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 주차</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3주차</div>
            <p className="text-xs text-muted-foreground">
              2025.01.15 - 01.22
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 팀 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3팀</div>
            <p className="text-xs text-muted-foreground">
              팀당 4-5명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 인원</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">16명</div>
            <p className="text-xs text-muted-foreground">
              활성 멤버
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">로테이션 상태</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">활성</div>
            <p className="text-xs text-muted-foreground">
              진행 중
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 로테이션 선택 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>로테이션 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>로테이션 주차</Label>
              <Select
                value={selectedRotation.id}
                onValueChange={(value) => {
                  const rotation = rotationsData.find(r => r.id === value)
                  if (rotation) setSelectedRotation(rotation)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rotationsData.map(rotation => (
                    <SelectItem key={rotation.id} value={rotation.id}>
                      {rotation.week}주차 ({rotation.startDate} ~ {rotation.endDate})
                      {rotation.status === 'active' && ' - 현재'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShuffle}>
                <Shuffle className="mr-2 h-4 w-4" />
                팀 재배정
              </Button>
              <Button 
                onClick={handleActivate}
                disabled={selectedRotation.status === 'active'}
              >
                <Play className="mr-2 h-4 w-4" />
                활성화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 팀 구성 */}
      <div className="grid gap-6 md:grid-cols-3">
        {selectedRotation.teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <Badge variant="outline">{team.members.length}명</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.members.map((member, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted" />
                      <span className="text-sm">{member}</span>
                    </div>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        팀 리더
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="mr-2 h-3 w-3" />
                  팀 편집
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 로테이션 히스토리 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>로테이션 히스토리</CardTitle>
          <CardDescription>
            지난 로테이션 기록
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>주차</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>팀 수</TableHead>
                <TableHead>총 인원</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rotationsData.map((rotation) => (
                <TableRow key={rotation.id}>
                  <TableCell className="font-medium">
                    {rotation.week}주차
                  </TableCell>
                  <TableCell>
                    {rotation.startDate} ~ {rotation.endDate}
                  </TableCell>
                  <TableCell>{rotation.teams.length}팀</TableCell>
                  <TableCell>
                    {rotation.teams.reduce((sum, team) => sum + team.members.length, 0)}명
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={rotation.status === 'active' ? 'default' : 'secondary'}
                    >
                      {rotation.status === 'active' ? '활성' : '완료'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      상세보기
                    </Button>
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