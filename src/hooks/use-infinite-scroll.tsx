'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Post } from '@/types/post'

interface UseInfiniteScrollOptions {
  threshold?: number
  rootMargin?: string
  enabled?: boolean
}

interface InfiniteScrollResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
  reset: () => void
  total: number
}

export function useInfiniteScroll<T>(
  fetchFunction: (page: number, limit: number) => Promise<{
    data: T[]
    total: number
    hasMore: boolean
  }>,
  options: UseInfiniteScrollOptions = {}
): InfiniteScrollResult<T> {
  const { threshold = 0.1, rootMargin = '100px', enabled = true } = options
  
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement | null>(null)
  
  const limit = 20 // 페이지당 아이템 수

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !enabled) return

    setLoading(true)
    setError(null)

    try {
      const result = await fetchFunction(page, limit)
      
      // 중복 제거: 이미 존재하는 ID는 제외하고 새 데이터만 추가
      setData(prevData => {
        const existingIds = new Set(prevData.map((item) => (item as { id: string }).id))
        const uniqueNewData = result.data.filter((item) => !existingIds.has((item as { id: string }).id))
        return [...prevData, ...uniqueNewData]
      })
      setTotal(result.total)
      setHasMore(result.hasMore)
      setPage(prevPage => prevPage + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, page, limit, loading, hasMore, enabled])

  const reset = useCallback(() => {
    setData([])
    setPage(1)
    setHasMore(true)
    setError(null)
    setTotal(0)
  }, [])

  // Intersection Observer 설정
  useEffect(() => {
    if (!enabled) return

    const currentLoadingRef = loadingRef.current
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    if (currentLoadingRef) {
      observerRef.current.observe(currentLoadingRef)
    }

    return () => {
      if (observerRef.current && currentLoadingRef) {
        observerRef.current.unobserve(currentLoadingRef)
      }
    }
  }, [hasMore, loading, loadMore, threshold, rootMargin, enabled])

  // 초기 데이터 로드
  useEffect(() => {
    if (enabled && data.length === 0 && page === 1 && !loading) {
      loadMore()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, page, loading, loadMore])

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    total
  }
}

// 무한 스크롤 트리거 컴포넌트
interface InfiniteScrollTriggerProps {
  onIntersect: () => void
  loading?: boolean
  hasMore?: boolean
  children?: React.ReactNode
}

export function InfiniteScrollTrigger({ 
  onIntersect, 
  loading = false, 
  hasMore = true,
  children 
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading) {
          onIntersect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    const currentRef = triggerRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [onIntersect, hasMore, loading])

  return (
    <div ref={triggerRef} className="py-4">
      {children}
    </div>
  )
}

// 게시글 무한 스크롤 훅
export function useInfinitePostsScroll(category?: string, searchQuery?: string): InfiniteScrollResult<Post> {
  const fetchPosts = useCallback(async (page: number, limit: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: 'published'
    })

    if (category && category !== 'all') {
      params.append('category', category)
    }

    if (searchQuery) {
      params.append('q', searchQuery)
      const response = await fetch(`/api/posts/search?${params}`)
      if (!response.ok) throw new Error('검색 실패')
      return response.json()
    }

    const response = await fetch(`/api/posts?${params}`)
    if (!response.ok) throw new Error('게시글을 불러오는데 실패했습니다')
    
    const result = await response.json()
    return {
      data: result.posts || [],
      total: result.total || 0,
      hasMore: result.hasMore || false
    }
  }, [category, searchQuery])

  const scrollResult = useInfiniteScroll<Post>(fetchPosts, { enabled: true })
  const { reset } = scrollResult

  // category나 searchQuery가 변경될 때 상태 리셋
  useEffect(() => {
    reset()
  }, [category, searchQuery, reset])

  return scrollResult
}

// 커뮤니티 무한 스크롤 훅
export function useInfiniteCommunitiesScroll() {
  const fetchCommunities = useCallback(async (page: number, limit: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })

    const response = await fetch(`/api/communities?${params}`)
    if (!response.ok) throw new Error('커뮤니티를 불러오는데 실패했습니다')
    
    const result = await response.json()
    return {
      data: result.communities || [],
      total: result.total || 0,
      hasMore: result.hasMore || false
    }
  }, [])

  return useInfiniteScroll(fetchCommunities, { enabled: true })
}