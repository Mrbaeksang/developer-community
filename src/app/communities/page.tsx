'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PostCardSkeleton } from '@/components/ui/skeleton'
import { OptimizedAvatar } from '@/components/ui/optimized-image'
import { useCommunities } from '@/hooks/use-api'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { 
  Search, 
  Plus, 
  Users, 
  Lock, 
  Globe,
  MessageCircle,
  FileText,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface Community {
  id: string
  name: string
  slug: string
  description: string
  avatar_url?: string
  is_public: boolean
  is_default: boolean
  member_count: number
  max_members?: number
  owner?: { id: string; username: string }
  created_at: string
  tags?: string[]
  is_member?: boolean
}

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyMyCommunities, setShowOnlyMyCommunities] = useState(false)

  // React Query로 커뮤니티 목록 가져오기
  const { 
    data: communitiesData, 
    isLoading, 
    error: fetchError,
    refetch: refetchCommunities
  } = useCommunities({})

  const communities = communitiesData || []

  // 전체 커뮤니티와 프라이빗 커뮤니티 분리
  const allCommunity = communities.find(c => c.is_default)
  const privateCommunities = communities.filter(c => !c.is_default)

  const filteredCommunities = privateCommunities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = !showOnlyMyCommunities || community.is_member
    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="container py-8">
        {/* 헤더 스켈레톤 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
              <div className="h-5 w-96 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-10 w-40 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 bg-muted animate-pulse rounded flex-1" />
            <div className="h-10 w-40 bg-muted animate-pulse rounded" />
          </div>
        </div>
        
        {/* 콘텐츠 스켈레톤 */}
        <div className="space-y-12">
          <div>
            <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
            <div className="h-32 bg-muted animate-pulse rounded" />
          </div>
          <div>
            <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">커뮤니티 목록을 불러올 수 없습니다</h2>
          <p className="text-destructive mb-4">
            {fetchError instanceof Error ? fetchError.message : '알 수 없는 오류가 발생했습니다'}
          </p>
          <Button onClick={() => refetchCommunities()}>
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

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
      {allCommunity && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">공개 커뮤니티</h2>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <OptimizedAvatar
                    src={allCommunity.avatar_url}
                    alt={allCommunity.name}
                    size="lg"
                    fallbackInitial="🌐"
                    className="bg-primary text-primary-foreground"
                  />
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
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {allCommunity.member_count.toLocaleString()}명
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(allCommunity.created_at).toLocaleDateString('ko-KR')} 생성
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div />
              <Button asChild>
                <Link href={`/communities/${allCommunity.id}`}>
                  입장하기
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </section>
      )}

      {/* 프라이빗 커뮤니티 목록 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">프라이빗 커뮤니티</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCommunities.map((community) => {
            const isMember = community.is_member || false
            const isFull = community.max_members ? community.member_count >= community.max_members : false

            return (
              <Card key={community.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <OptimizedAvatar
                      src={community.avatar_url}
                      alt={community.name}
                      size="md"
                      fallbackInitial={community.name.slice(0, 2).toUpperCase()}
                    />
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
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {community.member_count}/{community.max_members || '∞'}
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