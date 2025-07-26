/**
 * 메인 페이지 (지식공유 피드)
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ knowledge_posts 테이블 없음!
 * - ✅ posts 테이블에서 board_type='knowledge' 필터링
 * - 📌 메인 페이지는 지식공유 게시글만 표시
 * 
 * ⚠️ 주의: 승인된(published) 게시글만 표시됨
 * 관리자 승인 대기 중인 게시글은 안 보임
 */

'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
import { PostCardSkeleton } from '@/components/ui/skeleton'
import { OptimizedAvatar } from '@/components/ui/optimized-image'
import { useInfinitePostsScroll } from '@/hooks/use-infinite-scroll'
import { useCategories } from '@/hooks/use-api'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/auth'
import { 
  Eye, 
  Heart, 
  MessageCircle,
  PenSquare,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { HighlightedText } from '@/utils/highlight'

function HomePageContent() {
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [user, setUser] = useState<Pick<User, 'id' | 'email' | 'role'> | null>(null)
  const [showFloatingButton, setShowFloatingButton] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const supabase = createClient()
  
  // URL에서 검색어 가져오기
  const searchQuery = searchParams.get('search') || ''
  
  // React Query 훅들 사용
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  
  // 무한 스크롤로 게시글 로드
  const {
    data: infinitePosts,
    loading: infiniteLoading,
    error: infiniteError,
    hasMore,
    loadMore,
    reset: resetInfinitePosts
  } = useInfinitePostsScroll(
    selectedCategory === 'all' ? undefined : selectedCategory,
    searchQuery.length >= 2 ? searchQuery : undefined
  )

  // 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Get user profile with role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: profile?.role || 'user'
        })
      } else {
        setUser(null)
      }
    }
    getUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 스크롤 방향 감지하여 플로팅 버튼 표시/숨김
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // 아래로 스크롤 - 버튼 숨김
      setShowFloatingButton(false)
    } else {
      // 위로 스크롤 - 버튼 표시
      setShowFloatingButton(true)
    }
    
    setLastScrollY(currentScrollY)
  }, [lastScrollY])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 컴포넌트 언마운트 시 상태 정리
  useEffect(() => {
    return () => {
      resetInfinitePosts()
    }
  }, [resetInfinitePosts])

  // 카테고리 데이터 준비 (전체 카테고리 추가)
  const categories = categoriesData ? [
    { id: 'all', name: '전체', slug: 'all', color: '#007AFF' },
    ...categoriesData.map(cat => ({ ...cat, color: '#007AFF' }))
  ] : []

  // 로딩 상태 통합
  const isInitialLoading = categoriesLoading

  // 초기 로딩 상태 - 스켈레톤 표시
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 카테고리 탭 스켈레톤 */}
        <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
          <div className="container py-3">
            <div className="flex gap-6 overflow-x-auto scrollbar-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 w-16 bg-gray-200 animate-pulse rounded-md flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>

        {/* 콘텐츠 스켈레톤 */}
        <div className="container max-w-3xl py-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 치명적 에러 상태
  if (infiniteError && !infinitePosts.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-16 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900">데이터를 불러올 수 없습니다</h2>
          <p className="text-gray-600 mb-4">{infiniteError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* iOS 스타일 카테고리 탭 */}
      <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="container py-3">
          <div className="flex gap-6 overflow-x-auto scrollbar-none">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "pb-3 text-sm font-medium transition-all whitespace-nowrap relative",
                  selectedCategory === category.id
                    ? "text-blue-500"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {category.name}
                {selectedCategory === category.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 - 단일 컬럼 */}
      <div className="container max-w-3xl py-6">
        <div className="space-y-4">
          {/* 검색 결과 표시 */}
          {searchQuery.length >= 2 && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                검색 결과: &quot;{searchQuery}&quot;
              </h2>
              <p className="text-sm text-gray-600">
                {infinitePosts.length}개의 게시글을 찾았습니다
              </p>
            </div>
          )}

          {/* 게시글 리스트 */}
          {infinitePosts.map((post) => (
            <Card key={post.id} className="bg-white border-gray-200 hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium line-clamp-2">
                  <Link 
                    href={`/posts/${post.id}`} 
                    className="text-gray-900 hover:text-blue-500 transition-colors"
                  >
                    {searchQuery ? (
                      <HighlightedText text={post.title} query={searchQuery} />
                    ) : (
                      post.title
                    )}
                  </Link>
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 line-clamp-1 mt-1">
                  {searchQuery ? (
                    <HighlightedText text={post.excerpt || ''} query={searchQuery} />
                  ) : (
                    post.excerpt
                  )}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0 pb-3">
                <div className="flex items-center justify-between w-full text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <OptimizedAvatar 
                      src={post.author?.avatar_url || undefined}
                      alt={post.author?.display_name || post.author?.username || 'User'}
                      size="sm"
                      fallbackInitial={(post.author?.display_name || post.author?.username || 'U')[0]?.toUpperCase()}
                    />
                    <span>{post.author?.display_name || post.author?.username || 'Anonymous'}</span>
                    <span>·</span>
                    <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.view_count?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {post.like_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.comment_count || 0}
                    </span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}

          {/* 로딩 표시 */}
          {infiniteLoading && (
            <div className="space-y-4 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* 더 보기 버튼 */}
          {hasMore && !infiniteLoading && (
            <div className="mt-6 text-center">
              <button 
                onClick={loadMore}
                className="px-6 py-2 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
              >
                더 보기
              </button>
            </div>
          )}

          {/* 모든 데이터 로드 완료 */}
          {!hasMore && infinitePosts.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              모든 게시글을 불러왔습니다
            </div>
          )}

          {/* 게시글 없음 */}
          {infinitePosts.length === 0 && !infiniteLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {searchQuery.length >= 2 ? (
                  <>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      검색 결과가 없습니다
                    </p>
                    <p className="text-sm text-gray-600">
                      다른 키워드로 검색해보세요
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      아직 게시글이 없습니다
                    </p>
                    <p className="text-sm text-gray-600">
                      첫 번째 게시글을 작성해보세요
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 플로팅 액션 버튼 */}
      {user && (
        <Link 
          href="/write"
          className={cn(
            "fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg",
            "flex items-center justify-center hover:bg-blue-600 transition-all",
            "transform",
            showFloatingButton ? "translate-y-0" : "translate-y-20"
          )}
        >
          <PenSquare className="h-6 w-6" />
        </Link>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        {/* 카테고리 탭 스켈레톤 */}
        <div className="sticky top-14 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
          <div className="container py-3">
            <div className="flex gap-6 overflow-x-auto scrollbar-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 w-16 bg-gray-200 animate-pulse rounded-md flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>

        {/* 콘텐츠 스켈레톤 */}
        <div className="container max-w-3xl py-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}