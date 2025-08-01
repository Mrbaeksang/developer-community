/**
 * 기본 API 클라이언트와 React Query 설정
 */

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { ERROR_MESSAGES } from '@/lib/constants/app'

// 기본 API 클라이언트
class ApiClient {
  private baseUrl: string

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // Handle nested response structure for post detail endpoint
      if (endpoint.match(/^\/posts\/[^\/]+$/) && data.post) {
        return data.post as T
      }
      
      // Handle comments endpoint response - check for both data.comments and direct array
      if (endpoint.includes('/comments')) {
        // For GET requests, extract comments array from response
        if (options.method === undefined || options.method === 'GET') {
          if (data.comments && Array.isArray(data.comments)) {
            return data.comments as T
          }
          // If data is directly an array (fallback)
          if (Array.isArray(data)) {
            return data as T
          }
        }
        // For POST requests, return the single comment
        if (options.method === 'POST' && data.comment) {
          return data.comment as T
        }
      }
      
      return data
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR)
      }
      throw error
    }
  }

  get<T>(endpoint: string, params?: Record<string, string>) {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params)}`
      : endpoint
    
    return this.request<T>(url)
  }

  post<T>(endpoint: string, data?: Record<string, unknown>) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  put<T>(endpoint: string, data?: Record<string, unknown>) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  delete<T>(endpoint: string, options?: { data?: Record<string, unknown> }) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: options?.data ? JSON.stringify(options.data) : undefined,
    })
  }
}

export const apiClient = new ApiClient()

// Query 키 관리
export const createQueryKeys = (entity: string) => ({
  all: [entity] as const,
  lists: () => [...createQueryKeys(entity).all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...createQueryKeys(entity).lists(), filters] as const,
  details: () => [...createQueryKeys(entity).all, 'detail'] as const,
  detail: (id: string) => [...createQueryKeys(entity).details(), id] as const,
  search: (query: string) => [...createQueryKeys(entity).all, 'search', query] as const,
})

// 공통 훅 유틸리티
export function useInvalidateQueries() {
  const queryClient = useQueryClient()
  
  return useCallback((queryKey: unknown[]) => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient])
}

export function usePrefetchQuery() {
  const queryClient = useQueryClient()
  
  return useCallback(async (queryKey: unknown[], queryFn: () => Promise<unknown>) => {
    await queryClient.prefetchQuery({ queryKey, queryFn })
  }, [queryClient])
}

// 에러 처리 유틸리티
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return ERROR_MESSAGES.UNKNOWN_ERROR
}