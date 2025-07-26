/**
 * 관리자 관련 API 훅들
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, createQueryKeys } from './base'
import { CACHE_TIME } from '@/lib/constants/app'
import type { 
  AdminStats,
  AdminUser,
  AdminPost,
  AdminCommunity,
  AdminFilters,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  PopularTag
} from '@/types/admin'

// Query Keys
export const adminKeys = createQueryKeys('admin')
export const statsKeys = createQueryKeys('stats')
export const categoryKeys = createQueryKeys('categories')
export const tagKeys = createQueryKeys('tags')

export const adminQueryKeys = {
  ...adminKeys,
  stats: () => [...statsKeys.all, 'overview'] as const,
  users: (filters: AdminFilters) => [...adminKeys.all, 'users', filters] as const,
  posts: (filters: AdminFilters) => [...adminKeys.all, 'posts', filters] as const,
  communities: (filters: AdminFilters) => [...adminKeys.all, 'communities', filters] as const,
}

// 관리자 통계 조회
export function useAdminStats() {
  return useQuery({
    queryKey: adminQueryKeys.stats(),
    queryFn: () => apiClient.get<AdminStats>('/admin/stats'),
    staleTime: CACHE_TIME.LONG, // 10분
  })
}

// 관리자 사용자 목록 조회
export function useAdminUsers(filters: AdminFilters = {}) {
  return useQuery({
    queryKey: adminQueryKeys.users(filters),
    queryFn: () => apiClient.get<AdminUser[]>('/admin/users', filters as Record<string, string>),
    staleTime: CACHE_TIME.MEDIUM,
  })
}

// 관리자 게시글 목록 조회
export function useAdminPosts(filters: AdminFilters = {}) {
  return useQuery({
    queryKey: adminQueryKeys.posts(filters),
    queryFn: () => apiClient.get<AdminPost[]>('/admin/posts', filters as Record<string, string>),
    staleTime: CACHE_TIME.MEDIUM,
  })
}

// 관리자 커뮤니티 목록 조회
export function useAdminCommunities(filters: AdminFilters = {}) {
  return useQuery({
    queryKey: adminQueryKeys.communities(filters),
    queryFn: () => apiClient.get<AdminCommunity[]>('/admin/communities', filters as Record<string, string>),
    staleTime: CACHE_TIME.MEDIUM,
  })
}

// 카테고리 목록 조회
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () => apiClient.get<Category[]>('/categories'),
    staleTime: CACHE_TIME.VERY_LONG, // 1시간 (카테고리는 자주 변경되지 않음)
  })
}

// 인기 태그 조회
export function usePopularTags(limit: number = 10) {
  return useQuery({
    queryKey: [...tagKeys.all, 'popular', limit],
    queryFn: () => apiClient.get<PopularTag[]>('/tags/popular', { limit: limit.toString() }),
    staleTime: CACHE_TIME.LONG, // 30분
  })
}

// 사용자 역할 변경
export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'user' }) =>
      apiClient.put(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
  })
}

// 사용자 상태 변경 (활성화/비활성화/차단)
export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      userId, 
      status, 
      reason 
    }: { 
      userId: string; 
      status: 'active' | 'inactive' | 'banned'; 
      reason?: string 
    }) =>
      apiClient.put(`/admin/users/${userId}/status`, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
  })
}

// 게시글 상태 변경 (승인/거부/게시)
export function useUpdatePostStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      postId, 
      status, 
      reason 
    }: { 
      postId: string; 
      status: 'pending' | 'published' | 'rejected'; 
      reason?: string 
    }) =>
      apiClient.put(`/admin/posts/${postId}/status`, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
      queryClient.invalidateQueries({ queryKey: statsKeys.all })
    },
  })
}

// 게시글 삭제 (관리자)
export function useAdminDeletePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ postId }: { postId: string; reason?: string }) =>
      apiClient.delete(`/admin/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
      queryClient.invalidateQueries({ queryKey: statsKeys.all })
    },
  })
}

// 커뮤니티 삭제 (관리자)
export function useAdminDeleteCommunity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ communityId }: { communityId: string; reason?: string }) =>
      apiClient.delete(`/admin/communities/${communityId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
      queryClient.invalidateQueries({ queryKey: statsKeys.all })
    },
  })
}

// 카테고리 생성
export function useCreateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateCategoryInput) => apiClient.post<Category>('/admin/categories', data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

// 카테고리 수정
export function useUpdateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) =>
      apiClient.put<Category>(`/admin/categories/${id}`, data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

// 카테고리 삭제
export function useDeleteCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

// 시스템 설정 조회
export function useSystemSettings() {
  return useQuery({
    queryKey: [...adminKeys.all, 'settings'],
    queryFn: () => apiClient.get('/admin/settings'),
    staleTime: CACHE_TIME.VERY_LONG,
  })
}

// 시스템 설정 업데이트
export function useUpdateSystemSettings() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => 
      apiClient.put('/admin/settings', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'settings'] })
    },
  })
}