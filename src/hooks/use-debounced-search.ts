'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Post } from '@/types/post'

interface UseSearchOptions {
  delay?: number
  minLength?: number
}

interface SearchResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  hasMore: boolean
  total: number
}

export interface SearchSuggestion {
  id: string
  title: string
  excerpt: string
  category: string
  type: 'post' | 'community' | 'user'
}

export function useDebouncedSearch<T>(
  searchFn: (query: string, options?: Record<string, unknown>) => Promise<{ data: T[], total: number }>,
  options: UseSearchOptions = {}
) {
  const { delay = 300, minLength = 2 } = options
  
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [result, setResult] = useState<SearchResult<T>>({
    data: [],
    loading: false,
    error: null,
    hasMore: false,
    total: 0
  })

  // searchFn의 참조를 고정
  const searchFnRef = useRef(searchFn)
  useEffect(() => {
    searchFnRef.current = searchFn
  }, [searchFn])

  // 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, delay)

    return () => clearTimeout(timer)
  }, [query, delay])

  // 검색 실행
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < minLength) {
      setResult({
        data: [],
        loading: false,
        error: null,
        hasMore: false,
        total: 0
      })
      return
    }

    let isCancelled = false

    const performSearch = async () => {
      if (isCancelled) return
      
      setResult(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const response = await searchFnRef.current(debouncedQuery)
        if (!isCancelled) {
          setResult({
            data: response.data,
            loading: false,
            error: null,
            hasMore: response.data.length < response.total,
            total: response.total
          })
        }
      } catch (error) {
        if (!isCancelled) {
          setResult(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : '검색 중 오류가 발생했습니다'
          }))
        }
      }
    }

    performSearch()

    return () => {
      isCancelled = true
    }
  }, [debouncedQuery, minLength])

  return {
    query,
    setQuery,
    result,
    isSearching: query.length >= minLength && result.loading
  }
}

// 게시글 검색 훅
export function usePostSearch() {
  const searchPosts = useCallback(async (query: string, options?: {
    category?: string
    limit?: number
    offset?: number
  }) => {
    const { category, limit = 20, offset = 0 } = options || {}
    
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      offset: offset.toString()
    })
    
    if (category && category !== 'all') {
      params.append('category', category)
    }
    
    const response = await fetch(`/api/posts/search?${params}`)
    if (!response.ok) {
      throw new Error('검색 요청 실패')
    }
    
    return response.json()
  }, [])

  return useDebouncedSearch(searchPosts, { delay: 300, minLength: 2 })
}

// 커뮤니티 검색 훅
export function useCommunitySearch() {
  const searchCommunities = useCallback(async (query: string) => {
    const params = new URLSearchParams({ q: query })
    
    const response = await fetch(`/api/communities/search?${params}`)
    if (!response.ok) {
      throw new Error('검색 요청 실패')
    }
    
    return response.json()
  }, [])

  return useDebouncedSearch(searchCommunities, { delay: 300, minLength: 2 })
}

// 사용자 검색 훅
export function useUserSearch() {
  const searchUsers = useCallback(async (query: string) => {
    const params = new URLSearchParams({ q: query })
    
    const response = await fetch(`/api/users/search?${params}`)
    if (!response.ok) {
      throw new Error('검색 요청 실패')
    }
    
    return response.json()
  }, [])

  return useDebouncedSearch(searchUsers, { delay: 300, minLength: 2 })
}

// 최근 검색어 관리 훅
export function useRecentSearches(maxItems: number = 5) {
  const [searches, setSearches] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches')
    if (stored) {
      try {
        setSearches(JSON.parse(stored))
      } catch {
        // 잘못된 데이터 무시
      }
    }
  }, [])

  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return

    setSearches(prev => {
      const filtered = prev.filter(s => s !== query)
      const updated = [query, ...filtered].slice(0, maxItems)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
  }, [maxItems])

  const removeSearch = useCallback((query: string) => {
    setSearches(prev => {
      const updated = prev.filter(s => s !== query)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearSearches = useCallback(() => {
    setSearches([])
    localStorage.removeItem('recentSearches')
  }, [])

  return {
    searches,
    addSearch,
    removeSearch,
    clearSearches
  }
}

// 검색 제안을 위한 훅
export function useSearchSuggestions() {
  const searchSuggestions = useCallback(async (query: string): Promise<{
    data: SearchSuggestion[],
    total: number
  }> => {
    const params = new URLSearchParams({
      q: query,
      limit: '5',
      status: 'published'
    })

    const response = await fetch(`/api/posts/search?${params}`)
    if (!response.ok) {
      throw new Error('검색 요청 실패')
    }

    const result = await response.json()
    const suggestions: SearchSuggestion[] = (result.posts || []).map((post: Post) => ({
      id: post.id,
      title: post.title,
      excerpt: post.excerpt || '',
      category: post.category?.name || '',
      type: 'post' as const
    }))

    return {
      data: suggestions,
      total: result.total || 0
    }
  }, [])

  return useDebouncedSearch<SearchSuggestion>(searchSuggestions, { 
    delay: 200, 
    minLength: 2 
  })
}