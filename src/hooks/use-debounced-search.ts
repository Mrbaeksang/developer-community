'use client'

import { useState, useEffect, useCallback } from 'react'

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
        const response = await searchFn(debouncedQuery)
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