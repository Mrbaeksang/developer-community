/**
 * 인증 관련 API 훅들
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, createQueryKeys } from './base'
import { CACHE_TIME } from '@/lib/constants/app'
import type { 
  User, 
  LoginInput, 
  SignupInput, 
  UpdateProfileInput,
  AuthResponse 
} from '@/types/auth'

// Query Keys
export const authKeys = createQueryKeys('auth')
export const userKeys = createQueryKeys('users')

export const authQueryKeys = {
  ...authKeys,
  currentUser: () => [...authKeys.all, 'current'] as const,
  profile: (id: string) => [...userKeys.all, 'profile', id] as const,
}

// 현재 사용자 정보 조회
export function useCurrentUser() {
  return useQuery({
    queryKey: authQueryKeys.currentUser(),
    queryFn: () => apiClient.get<User>('/auth/me'),
    staleTime: CACHE_TIME.MEDIUM,
    retry: false, // 인증 실패시 재시도하지 않음
  })
}

// 사용자 프로필 조회
export function useUserProfile(id: string) {
  return useQuery({
    queryKey: authQueryKeys.profile(id),
    queryFn: () => apiClient.get<User>(`/users/${id}`),
    enabled: !!id,
    staleTime: CACHE_TIME.LONG,
  })
}

// 로그인
export function useLogin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: LoginInput) => apiClient.post<AuthResponse>('/auth/login', data),
    onSuccess: (response) => {
      // 현재 사용자 정보를 캐시에 저장
      if (response.user) {
        queryClient.setQueryData(authQueryKeys.currentUser(), response.user)
      }
    },
  })
}

// 회원가입
export function useSignup() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: SignupInput) => apiClient.post<AuthResponse>('/auth/signup', data),
    onSuccess: (response) => {
      // 현재 사용자 정보를 캐시에 저장
      if (response.user) {
        queryClient.setQueryData(authQueryKeys.currentUser(), response.user)
      }
    },
  })
}

// 로그아웃
export function useLogout() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => {
      // 모든 캐시 클리어
      queryClient.clear()
    },
  })
}

// 프로필 업데이트
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdateProfileInput) => apiClient.put<User>('/auth/profile', data),
    onSuccess: (updatedUser) => {
      // 현재 사용자 정보 업데이트
      queryClient.setQueryData(authQueryKeys.currentUser(), updatedUser)
      queryClient.setQueryData(authQueryKeys.profile(updatedUser.id), updatedUser)
    },
  })
}

// 비밀번호 변경
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => 
      apiClient.put('/auth/password', data),
  })
}

// 이메일 인증 재발송
export function useResendEmailVerification() {
  return useMutation({
    mutationFn: () => apiClient.post('/auth/resend-verification'),
  })
}

// 비밀번호 재설정 요청
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => apiClient.post('/auth/reset-password', { email }),
  })
}

// 비밀번호 재설정 확인
export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (data: { token: string; password: string }) => 
      apiClient.post('/auth/reset-password/confirm', data),
  })
}

// OAuth 로그인 (소셜 로그인)
export function useOAuthLogin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (provider: 'google' | 'github' | 'discord') => 
      apiClient.post<AuthResponse>(`/auth/oauth/${provider}`),
    onSuccess: (response) => {
      if (response.user) {
        queryClient.setQueryData(authQueryKeys.currentUser(), response.user)
      }
    },
  })
}

// 계정 삭제
export function useDeleteAccount() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (password: string) => apiClient.delete('/auth/account', { data: { password } }),
    onSuccess: () => {
      // 모든 캐시 클리어
      queryClient.clear()
    },
  })
}

// 세션 갱신
export function useRefreshSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => apiClient.post<AuthResponse>('/auth/refresh'),
    onSuccess: (response) => {
      if (response.user) {
        queryClient.setQueryData(authQueryKeys.currentUser(), response.user)
      }
    },
  })
}