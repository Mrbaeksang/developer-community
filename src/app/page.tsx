'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PostCardSkeleton } from '@/components/ui/skeleton'
import { OptimizedAvatar } from '@/components/ui/optimized-image'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { useInfinitePostsScroll } from '@/hooks/use-infinite-scroll'
import { 
  usePosts, 
  useCategories, 
  useAdminStats, 
  usePopularTags,
  useSearchPosts 
} from '@/hooks/use-api'
import { 
  Search, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle,
  PenSquare,
  Users,
  Flame,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import type { Post, Category, Author } from '@/types/post'

// 타입 정의
interface Tag {
  tag: string
  count: number
}

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // React Query 훅들 사용
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const { data: statsData, isLoading: statsLoading } = useAdminStats()
  const { data: tagsData, isLoading: tagsLoading } = usePopularTags(10)
  
  // Featured posts (최신 2개)
  const { data: featuredPosts, isLoading: featuredLoading } = usePosts({ 
    limit: 2, 
    status: 'published' 
  })
  
  // 검색 기능 (디바운싱 적용)
  const { 
    result: { data: searchResults, loading: searchLoading, error: searchError }
  } = useDebouncedSearch(
    async (query: string) => {
      const response = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('검색 실패')
      return response.json()
    },
    { delay: 300, minLength: 2 }
  )
  
  // 무한 스크롤로 게시글 로드
  const {
    data: infinitePosts,
    loading: infiniteLoading,
    error: infiniteError,
    hasMore,
    loadMore
  } = useInfinitePostsScroll(
    selectedCategory === 'all' ? undefined : selectedCategory,
    searchQuery.length >= 2 ? searchQuery : undefined
  )

  // 검색 상태 업데이트
  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    if (value.length >= 2) {
      // 검색 실행 (디바운싱됨)
    }
  }

  // 카테고리 데이터 준비 (전체 카테고리 추가)
  const categories = categoriesData ? [
    { id: 'all', name: '전체', slug: 'all', color: '#6B7280' },
    ...categoriesData
  ] : []

  // 로딩 상태 통합
  const isInitialLoading = categoriesLoading || statsLoading || tagsLoading || featuredLoading

  // 초기 로딩 상태 - 스켈레톤 표시
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* 히어로 섹션 스켈레톤 */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-background border-b">
          <div className="container py-12">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="h-12 bg-muted animate-pulse rounded-lg" />
              <div className="h-6 bg-muted animate-pulse rounded-lg w-2/3 mx-auto" />
              <div className="h-12 bg-muted animate-pulse rounded-lg w-96 mx-auto" />
            </div>
          </div>
        </section>

        {/* 카테고리 스켈레톤 */}
        <section className="border-b">
          <div className="container py-4">
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 w-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </section>

        {/* 콘텐츠 스켈레톤 */}
        <div className="container py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-4">
                <div className="h-8 w-40 bg-muted animate-pulse rounded" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>
            </div>
            <aside className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
              ))}
            </aside>
          </div>
        </div>
      </div>
    )
  }

  // 치명적 에러 상태
  if (infiniteError && !infinitePosts.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container py-16 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">데이터를 불러올 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">{infiniteError}</p>
          <Button onClick={() => window.location.reload()}>
            페이지 새로고침
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 히어로 섹션 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-background border-b">
        <div className="container py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              개발자 커뮤니티
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              지식을 공유하고, 함께 성장하는 개발자들의 공간
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="관심있는 주제를 검색해보세요..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/posts/write">
                  <PenSquare className="mr-2 h-4 w-4" />
                  글쓰기
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 배경 장식 */}
        <div className="absolute inset-0 -z-10 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
      </section>

      {/* 카테고리 필터 */}
      <section className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 인기 게시글 */}
            {selectedCategory === 'all' && featuredPosts && featuredPosts.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <h2 className="text-2xl font-bold">인기 게시글</h2>
                </div>
                <div className="grid gap-4">
                  {featuredPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-xl line-clamp-2">
                              <Link href={`/posts/${post.id}`} className="hover:text-primary transition-colors">
                                {post.title}
                              </Link>
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {post.excerpt}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" style={{ backgroundColor: `${post.category.color}20`, color: post.category.color }}>
                            {post.category.name}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {post.view_count?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.like_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {post.comment_count || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <OptimizedAvatar 
                            src={post.author?.avatar_url}
                            alt={post.author?.full_name || post.author?.username || ''}
                            size="sm"
                          />
                          <span>{post.author?.full_name || post.author?.username}</span>
                          <span>·</span>
                          <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* 최신 게시글 (무한 스크롤) */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h2 className="text-2xl font-bold">
                  {searchQuery.length >= 2 ? `검색 결과: "${searchQuery}"` : '최신 게시글'}
                </h2>
                {searchQuery.length >= 2 && (
                  <Badge variant="secondary">
                    {infinitePosts.length}개 발견
                  </Badge>
                )}
              </div>

              {/* 검색 에러 표시 */}
              {searchError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                  <p className="text-sm text-destructive">검색 중 오류가 발생했습니다: {searchError}</p>
                </div>
              )}

              <div className="space-y-4">
                {infinitePosts.map((post, index: number) => (
                  <Card key={`${post.id}-${index}`} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg line-clamp-1">
                            <Link href={`/posts/${post.id}`} className="hover:text-primary transition-colors">
                              {post.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {post.excerpt}
                          </CardDescription>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {post.tags.slice(0, 3).map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" style={{ borderColor: post.category.color, color: post.category.color }}>
                          {post.category.name}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-3 pb-4">
                      <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {post.view_count?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {post.like_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {post.comment_count || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <OptimizedAvatar 
                            src={post.author?.avatar_url}
                            alt={post.author?.full_name || post.author?.username || ''}
                            size="sm"
                          />
                          <span>{post.author?.full_name || post.author?.username}</span>
                          <span>·</span>
                          <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* 로딩 표시 및 무한 스크롤 트리거 */}
              {infiniteLoading && (
                <div className="mt-8 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* 더 불러올 데이터가 있을 때 트리거 */}
              {hasMore && !infiniteLoading && (
                <div className="mt-8 text-center">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={loadMore}
                    className="w-full sm:w-auto"
                  >
                    더 많은 게시글 보기
                  </Button>
                </div>
              )}

              {/* 모든 데이터 로드 완료 */}
              {!hasMore && infinitePosts.length > 0 && (
                <div className="mt-8 text-center text-sm text-muted-foreground">
                  모든 게시글을 불러왔습니다
                </div>
              )}

              {/* 검색 결과 없음 */}
              {searchQuery.length >= 2 && infinitePosts.length === 0 && !infiniteLoading && (
                <div className="mt-8 text-center py-12">
                  <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">검색 결과가 없습니다</h3>
                  <p className="text-muted-foreground">
                    다른 키워드로 검색해보세요
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* 사이드바 */}
          <aside className="space-y-6">
            {/* 커뮤니티 소개 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  커뮤니티 소개
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  개발자들이 지식을 공유하고 함께 성장하는 공간입니다. 
                  프로젝트, 기술 트렌드, 커리어 등 다양한 주제로 소통해보세요.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">전체 회원</span>
                    <span className="font-medium">
                      {statsLoading ? (
                        <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                      ) : (
                        `${statsData?.overview?.total_users?.toLocaleString() || 0}명`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">전체 게시글</span>
                    <span className="font-medium">
                      {statsLoading ? (
                        <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                      ) : (
                        `${statsData?.overview?.total_posts?.toLocaleString() || 0}개`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">활성 커뮤니티</span>
                    <span className="font-medium">
                      {statsLoading ? (
                        <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                      ) : (
                        `${statsData?.overview?.total_communities?.toLocaleString() || 0}개`
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href="/communities">
                    커뮤니티 둘러보기
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* 인기 태그 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  인기 태그
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tagsLoading ? (
                    // 태그 로딩 스켈레톤
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-6 w-16 bg-muted animate-pulse rounded-full" />
                    ))
                  ) : tagsData && tagsData.length > 0 ? (
                    tagsData.map((tagData: { tag: string; count: number }) => (
                      <Badge 
                        key={tagData.tag} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={() => handleSearchInput(tagData.tag)}
                      >
                        #{tagData.tag} ({tagData.count})
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">태그가 없습니다</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 글쓰기 안내 */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>첫 글을 작성해보세요!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  여러분의 지식과 경험을 공유해주세요. 
                  작성하신 글은 관리자 검토 후 게시됩니다.
                </p>
                <Button asChild className="w-full">
                  <Link href="/posts/write">
                    <PenSquare className="mr-2 h-4 w-4" />
                    글쓰기
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}