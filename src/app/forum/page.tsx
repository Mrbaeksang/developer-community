/**
 * 자유게시판 페이지
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts 테이블 없음! UI 경로(/forum)에 속지 마세요!
 * - ✅ 모든 게시글은 posts 테이블에서 board_type_id로 필터링
 * - 📌 board_type_id로 구분:
 *   - 자유게시판: '00f8f32b-faca-4947-94f5-812a0bb97c39' (slug: 'forum')
 * 
 * 🔄 API 호출:
 * - /api/free-posts → posts 테이블 (board_type='forum' 필터링)
 * - 자유게시판은 즉시 게시 (관리자 승인 불필요)
 * 
 * ⚠️ 주의: /forum 경로지만 실제로는 posts 테이블 사용!
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { 
  PenSquare, 
  MessageSquare, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  Heart,
  Search,
  Coffee,
  MessageCircle,
  AlertCircle
} from 'lucide-react'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Post {
  id: string
  title: string
  excerpt: string
  created_at: string
  view_count?: number
  like_count?: number
  comment_count?: number
  tags?: string[]
  author?: {
    username: string
    display_name?: string
    avatar_url?: string
  }
}

// 게시글 카드 스켈레톤
const PostCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </CardHeader>
    <CardFooter className="pt-3 pb-4">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </CardFooter>
  </Card>
)

function ForumPageContent() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchMode, setIsSearchMode] = useState(false)

  // 게시글 로드
  const loadPosts = async (isNewSearch = false) => {
    if (loading || (!hasMore && !isNewSearch)) return
    
    setLoading(true)
    setError(null)
    setSearchError(null)
    
    try {
      const currentPage = isNewSearch ? 1 : page
      const url = new URL('/api/free-posts', window.location.origin)
      url.searchParams.set('page', currentPage.toString())
      url.searchParams.set('limit', '10')
      
      if (searchQuery.length >= 2) {
        url.searchParams.set('search', searchQuery)
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch posts')
      
      const data = await response.json()
      
      if (isNewSearch) {
        setPosts(data.posts || [])
        setPage(1)
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])])
      }
      
      setHasMore(data.posts?.length === 10)
      setIsSearchMode(searchQuery.length >= 2)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '게시글을 불러오는데 실패했습니다'
      if (searchQuery.length >= 2) {
        setSearchError(errorMessage)
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // 초기 로드
  useEffect(() => {
    loadPosts(true)
  }, [])

  // 검색 처리
  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    if (value.length >= 2) {
      setPage(1)
      setPosts([])
      setHasMore(true)
      loadPosts(true)
    } else if (value.length === 0 && isSearchMode) {
      setPage(1)
      setPosts([])
      setHasMore(true)
      setIsSearchMode(false)
      loadPosts(true)
    }
  }

  // 더 많은 게시글 로드
  const loadMore = () => {
    setPage(prev => prev + 1)
  }

  useEffect(() => {
    if (page > 1) {
      loadPosts()
    }
  }, [page])


  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '자유게시판' }
  ]

  // 초기 로딩 상태
  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* 헤더 섹션 스켈레톤 */}
        <section className="border-b bg-muted/5">
          <div className="container py-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded-lg w-48 mx-auto" />
              <div className="h-6 bg-muted animate-pulse rounded-lg w-96 mx-auto" />
            </div>
          </div>
        </section>

        {/* 콘텐츠 스켈레톤 */}
        <div className="container py-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error && posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container py-16 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">데이터를 불러올 수 없습니다</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            페이지 새로고침
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 헤더 섹션 */}
      <section className="border-b bg-gradient-to-br from-orange-500/5 via-orange-500/10 to-background">
        <div className="container py-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Coffee className="h-8 w-8 text-orange-500" />
              <h1 className="text-3xl md:text-4xl font-bold">자유게시판</h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              개발 외의 일상, 취미, 관심사를 자유롭게 나누는 공간입니다
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="자유게시판 내 검색..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/write">
                  <PenSquare className="mr-2 h-4 w-4" />
                  글쓰기
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* 게시글 목록 */}
          <div className="space-y-4">
            {searchQuery.length >= 2 && (
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">
                  검색 결과: &quot;{searchQuery}&quot;
                </h2>
                <Badge variant="secondary">
                  {posts.length}개 발견
                </Badge>
              </div>
            )}

            {/* 검색 에러 표시 */}
            {searchError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                <p className="text-sm text-destructive">검색 중 오류가 발생했습니다: {searchError}</p>
              </div>
            )}

            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">
                      <Link href={`/forum/${post.id}`} className="hover:text-primary transition-colors">
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
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.author?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {(post.author?.display_name || post.author?.username || 'U')[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{post.author?.display_name || post.author?.username || 'Anonymous'}</span>
                      <span>·</span>
                      <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* 로딩 표시 */}
          {loading && (
            <div className="mt-8 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* 더 불러오기 버튼 */}
          {hasMore && !loading && (
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
          {!hasMore && posts.length > 0 && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              모든 게시글을 불러왔습니다
            </div>
          )}

          {/* 게시글 없음 */}
          {posts.length === 0 && !loading && (
            <div className="mt-8 text-center py-12">
              <Coffee className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery.length >= 2 ? '검색 결과가 없습니다' : '아직 게시글이 없습니다'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery.length >= 2 
                  ? '다른 키워드로 검색해보세요' 
                  : '자유게시판의 첫 번째 글을 작성해보세요!'}
              </p>
              {searchQuery.length < 2 && (
                <Button asChild>
                  <Link href="/write">
                    <PenSquare className="mr-2 h-4 w-4" />
                    첫 글 작성하기
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ForumPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* 헤더 섹션 스켈레톤 */}
        <section className="border-b bg-muted/5">
          <div className="container py-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="h-10 bg-muted animate-pulse rounded-lg w-48 mx-auto" />
              <div className="h-6 bg-muted animate-pulse rounded-lg w-96 mx-auto" />
            </div>
          </div>
        </section>

        {/* 콘텐츠 스켈레톤 */}
        <div className="container py-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    }>
      <ForumPageContent />
    </Suspense>
  )
}