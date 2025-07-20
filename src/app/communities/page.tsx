'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, 
  Plus, 
  Users, 
  Lock, 
  Globe,
  MessageCircle,
  FileText,
  Calendar,
  ChevronRight
} from 'lucide-react'

// 임시 커뮤니티 데이터
const allCommunity = {
  id: 'all',
  name: '전체 커뮤니티',
  slug: 'all',
  description: '모든 회원이 참여하는 공개 커뮤니티입니다. 자유롭게 소통하고 지식을 공유하세요.',
  is_public: true,
  is_default: true,
  member_count: 1234,
  owner: { id: 'system', username: 'system' },
  created_at: '2025-01-01T00:00:00Z',
  recent_activity: '방금 전',
  stats: {
    messages: 15420,
    memos: 342,
    files: 89
  }
}

const privateCommunities = [
  {
    id: '1',
    name: 'React 마스터즈',
    slug: 'react-masters',
    description: 'React와 Next.js를 깊이 있게 공부하는 소규모 스터디 그룹입니다.',
    avatar_url: null,
    is_public: false,
    member_count: 5,
    max_members: 10,
    owner: { id: '1', username: 'devmaster' },
    created_at: '2025-01-15T10:00:00Z',
    recent_activity: '2시간 전',
    tags: ['React', 'Next.js', 'TypeScript']
  },
  {
    id: '2',
    name: '백엔드 아키텍처 연구소',
    slug: 'backend-arch',
    description: '확장 가능한 백엔드 시스템 설계를 연구하고 토론하는 커뮤니티입니다.',
    avatar_url: null,
    is_public: false,
    member_count: 4,
    max_members: 5,
    owner: { id: '2', username: 'backend_expert' },
    created_at: '2025-01-10T14:30:00Z',
    recent_activity: '1일 전',
    tags: ['Backend', 'Architecture', 'Microservices']
  },
  {
    id: '3',
    name: 'AI 프로젝트팀',
    slug: 'ai-project',
    description: 'AI 기반 서비스를 함께 개발하는 프로젝트 팀입니다.',
    avatar_url: null,
    is_public: true, // 공개 커뮤니티 (가입 가능)
    member_count: 3,
    max_members: 6,
    owner: { id: '3', username: 'ai_developer' },
    created_at: '2025-01-18T09:00:00Z',
    recent_activity: '30분 전',
    tags: ['AI', 'Python', 'TensorFlow']
  }
]

// 현재 사용자가 속한 커뮤니티 ID (임시)
const userCommunities = ['1', '3']

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyMyCommunities, setShowOnlyMyCommunities] = useState(false)

  const filteredCommunities = privateCommunities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = !showOnlyMyCommunities || userCommunities.includes(community.id)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="container py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">커뮤니티</h1>
            <p className="text-muted-foreground">
              공개 커뮤니티에서 모두와 소통하거나, 소규모 프라이빗 커뮤니티를 만들어보세요
            </p>
          </div>
          <Button asChild>
            <Link href="/communities/create">
              <Plus className="mr-2 h-4 w-4" />
              커뮤니티 만들기
            </Link>
          </Button>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="커뮤니티 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showOnlyMyCommunities ? "default" : "outline"}
              onClick={() => setShowOnlyMyCommunities(!showOnlyMyCommunities)}
            >
              내 커뮤니티만 보기
            </Button>
          </div>
        </div>
      </div>

      {/* 전체 커뮤니티 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">공개 커뮤니티</h2>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Globe className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {allCommunity.name}
                    <Badge variant="secondary">기본</Badge>
                  </CardTitle>
                  <CardDescription>{allCommunity.description}</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{allCommunity.stats.messages.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">메시지</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{allCommunity.stats.memos}</p>
                <p className="text-sm text-muted-foreground">메모</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{allCommunity.stats.files}</p>
                <p className="text-sm text-muted-foreground">파일</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {allCommunity.member_count.toLocaleString()}명
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {allCommunity.recent_activity}
              </span>
            </div>
            <Button asChild>
              <Link href={`/communities/${allCommunity.id}`}>
                입장하기
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* 프라이빗 커뮤니티 목록 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">프라이빗 커뮤니티</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCommunities.map((community) => {
            const isMember = userCommunities.includes(community.id)
            const isFull = community.member_count >= community.max_members

            return (
              <Card key={community.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={community.avatar_url || undefined} />
                      <AvatarFallback>
                        {community.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1">
                      {community.is_public ? (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-3">{community.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {community.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {community.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {community.member_count}/{community.max_members}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(community.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  {isMember ? (
                    <Button asChild className="w-full" variant="default">
                      <Link href={`/communities/${community.id}`}>
                        입장하기
                      </Link>
                    </Button>
                  ) : community.is_public && !isFull ? (
                    <Button className="w-full" variant="outline">
                      가입 신청
                    </Button>
                  ) : !community.is_public ? (
                    <Button className="w-full" variant="secondary" disabled>
                      초대 전용
                    </Button>
                  ) : (
                    <Button className="w-full" variant="secondary" disabled>
                      정원 초과
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* 빈 상태 */}
        {filteredCommunities.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {showOnlyMyCommunities 
                ? '가입한 프라이빗 커뮤니티가 없습니다' 
                : '검색 결과가 없습니다'}
            </p>
            <Button asChild>
              <Link href="/communities/create">
                <Plus className="mr-2 h-4 w-4" />
                새 커뮤니티 만들기
              </Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}