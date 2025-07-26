/**
 * 통합 검색 페이지
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts, knowledge_posts 별도 검색 없음!
 * - ✅ 모든 검색은 posts 테이블에서 수행
 * - 📌 API 엔드포인트:
 *   - /api/posts/search → 지식공유 검색
 *   - /api/free-posts/search → 자유게시판 검색
 * 
 * ⚠️ 주의: API 경로가 다르지만 모두 같은 posts 테이블 검색!
 * board_type_id로 필터링하여 구분
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Search,
  BookOpen,
  MessageSquare,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Filter,
  X,
  AlertCircle,
  Coffee
} from 'lucide-react'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'

interface SearchResult {
  id: string
  title: string
  excerpt: string
  content?: string
  created_at: string
  type: 'knowledge' | 'forum'
  category?: {
    id: string
    name: string
  }
  author_id: string
  author?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  view_count?: number
  like_count?: number
  comment_count?: number
  tags?: string[]
}

interface SearchStats {
  total: number
  knowledge: number
  forum: number
}

interface Post {
  id: string
  title: string
  excerpt: string
  content?: string
  created_at: string
  author_id: string
  author?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  }
  view_count?: number
  like_count?: number
  comment_count?: number
  tags?: string[]
  category?: {
    id: string
    name: string
  }
}

// SearchResultSkeleton 컴포넌트를 먼저 정의
const SearchResultSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
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

function UnifiedSearchPageContent() {
  const searchParams = useSearchParams()
  const queryParam = searchParams.get('q') || ''
  const typeParam = searchParams.get('type') || 'all'
  
  const [query, setQuery] = useState(queryParam)
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [activeTab, setActiveTab] = useState<'all' | 'knowledge' | 'forum'>((typeParam as 'all' | 'knowledge' | 'forum') || 'all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<SearchStats>({ total: 0, knowledge: 0, forum: 0 })
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // 검색 실행
  const performSearch = async (newSearch = false) => {
    if (!query.trim() || query.length < 2) {
      setError('검색어는 2자 이상 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 검색 타입에 따라 다른 엔드포인트 호출
      const searchPromises = []
      
      if (activeTab === 'all' || activeTab === 'knowledge') {
        searchPromises.push(
          fetch(`/api/posts/search?q=${encodeURIComponent(query)}&page=${newSearch ? 1 : page}&limit=10`)
            .then(res => res.ok ? res.json() : Promise.reject('Failed to search knowledge posts'))
            .then(data => ({
              posts: (data.posts || []).map((post: Post) => ({ ...post, type: 'knowledge' as const })),
              total: data.total || 0
            }))
        )
      }

      if (activeTab === 'all' || activeTab === 'forum') {
        searchPromises.push(
          fetch(`/api/free-posts/search?q=${encodeURIComponent(query)}&page=${newSearch ? 1 : page}&limit=10`)
            .then(res => res.ok ? res.json() : Promise.reject('Failed to search forum posts'))
            .then(data => ({
              posts: (data.posts || []).map((post: Post) => ({ ...post, type: 'forum' as const })),
              total: data.total || 0
            }))
        )
      }

      const searchResults = await Promise.allSettled(searchPromises)
      
      let allResults: SearchResult[] = []
      let knowledgeCount = 0
      let forumCount = 0

      searchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allResults = [...allResults, ...result.value.posts]
          if (activeTab === 'all') {
            if (index === 0) knowledgeCount = result.value.total
            if (index === 1) forumCount = result.value.total
          } else if (activeTab === 'knowledge') {
            knowledgeCount = result.value.total
          } else if (activeTab === 'forum') {
            forumCount = result.value.total
          }
        }
      })

      // 정렬 (최신순)
      allResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      if (newSearch) {
        setResults(allResults)
        setPage(1)
      } else {
        setResults(prev => [...prev, ...allResults])
      }

      setStats({
        total: knowledgeCount + forumCount,
        knowledge: knowledgeCount,
        forum: forumCount
      })

      setHasMore(allResults.length === 10)
    } catch (err) {
      setError('검색 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 검색 실행
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.trim() && query.length >= 2) {
      setSearchQuery(query)
      performSearch(true)
    }
  }

  // 초기 검색 실행
  useEffect(() => {
    if (queryParam && queryParam.length >= 2) {
      setQuery(queryParam)
      setSearchQuery(queryParam)
      performSearch(true)
    }
  }, [queryParam])

  // 탭 변경 시 재검색
  useEffect(() => {
    if (searchQuery && searchQuery.length >= 2) {
      performSearch(true)
    }
  }, [activeTab])

  // 더 불러오기
  const loadMore = () => {
    setPage(prev => prev + 1)
  }

  useEffect(() => {
    if (page > 1 && searchQuery) {
      performSearch()
    }
  }, [page])

  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '검색' }
  ]

  // 검색 결과 카드 컴포넌트
  const SearchResultCard = ({ result }: { result: SearchResult }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {result.type === 'knowledge' ? (
                <BookOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Coffee className="h-4 w-4 text-orange-500" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {result.type === 'knowledge' ? '지식 공유' : '자유게시판'}
              </span>
              {result.category && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <Badge variant="outline" className="text-xs">
                    {result.category.name}
                  </Badge>
                </>
              )}
            </div>
            <CardTitle className="text-lg line-clamp-1">
              <Link 
                href={`/${result.type === 'knowledge' ? 'knowledge' : 'forum'}/${result.id}`}
                className="hover:text-primary transition-colors"
              >
                {result.title}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {result.excerpt || result.content?.substring(0, 150) + '...'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="pt-3 pb-4">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {result.view_count?.toLocaleString() || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {result.like_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {result.comment_count || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {result.author && (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={result.author.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(result.author.display_name || result.author.username || 'U')[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{result.author.display_name || result.author.username}</span>
                <span>·</span>
              </>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(result.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 헤더 섹션 */}
      <section className="border-b bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-background">
        <div className="container py-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Search className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">통합 검색</h1>
            </div>
            <p className="text-lg text-muted-foreground mb-6">
              지식 공유와 자유게시판의 모든 게시글을 검색하세요
            </p>

            {/* 검색 폼 */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="검색어를 입력하세요 (최소 2자)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 pr-12 h-14 text-lg"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setSearchQuery('')
                      setResults([])
                      setStats({ total: 0, knowledge: 0, forum: 0 })
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="mt-4"
                disabled={!query.trim() || query.length < 2 || loading}
              >
                <Search className="mr-2 h-4 w-4" />
                검색하기
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* 검색 결과 */}
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb items={breadcrumbItems} className="mb-6" />

          {searchQuery && (
            <>
              {/* 검색 결과 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  &quot;{searchQuery}&quot; 검색 결과
                </h2>
                {!loading && (
                  <Badge variant="secondary" className="text-sm">
                    총 {stats.total}개
                  </Badge>
                )}
              </div>

              {/* 탭 */}
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'knowledge' | 'forum')}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">
                    전체 ({stats.total})
                  </TabsTrigger>
                  <TabsTrigger value="knowledge">
                    <BookOpen className="mr-2 h-4 w-4" />
                    지식 공유 ({stats.knowledge})
                  </TabsTrigger>
                  <TabsTrigger value="forum">
                    <Coffee className="mr-2 h-4 w-4" />
                    자유게시판 ({stats.forum})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                  {/* 로딩 상태 */}
                  {loading && results.length === 0 && (
                    <>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <SearchResultSkeleton key={i} />
                      ))}
                    </>
                  )}

                  {/* 에러 상태 */}
                  {error && (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                      <p className="text-destructive">{error}</p>
                    </div>
                  )}

                  {/* 검색 결과 */}
                  {!loading && !error && results.length > 0 && (
                    <>
                      {results.map((result) => (
                        <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                      ))}

                      {/* 더 불러오기 */}
                      {hasMore && (
                        <div className="text-center mt-8">
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={loadMore}
                            disabled={loading}
                          >
                            {loading ? '불러오는 중...' : '더 보기'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* 검색 결과 없음 */}
                  {!loading && !error && searchQuery && results.length === 0 && (
                    <div className="text-center py-16">
                      <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">검색 결과가 없습니다</h3>
                      <p className="text-muted-foreground">
                        다른 검색어를 시도해보세요
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* 초기 상태 */}
          {!searchQuery && !loading && (
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">무엇을 찾고 계신가요?</h3>
              <p className="text-muted-foreground">
                검색어를 입력하여 지식 공유와 자유게시판의 게시글을 검색하세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UnifiedSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <section className="border-b bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-background">
          <div className="container py-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Search className="h-8 w-8 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold">통합 검색</h1>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                지식 공유와 자유게시판의 모든 게시글을 검색하세요
              </p>
            </div>
          </div>
        </section>
        <div className="container py-8">
          <div className="max-w-4xl mx-auto space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SearchResultSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    }>
      <UnifiedSearchPageContent />
    </Suspense>
  )
}