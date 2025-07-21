/**
 * 커뮤니티 관련 API 훅들
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, createQueryKeys } from './base'
import { REALTIME } from '@/lib/constants/app'
import type { 
  Community, 
  CommunityFilters,
  CreateCommunityInput,
  CommunityMessage,
  CommunityMemo,
  CommunityFile,
  CreateMemoInput,
  SendMessageInput,
  UploadFileInput
} from '@/types/community'

// Query Keys
export const communityKeys = createQueryKeys('communities')

export const communityQueryKeys = {
  ...communityKeys,
  messages: (id: string) => [...communityKeys.detail(id), 'messages'] as const,
  memos: (id: string) => [...communityKeys.detail(id), 'memos'] as const,
  files: (id: string) => [...communityKeys.detail(id), 'files'] as const,
}

// Communities 조회
export function useCommunities(filters: CommunityFilters = {}) {
  return useQuery({
    queryKey: communityKeys.list(filters),
    queryFn: () => apiClient.get<Community[]>('/communities', filters as Record<string, string>),
    staleTime: REALTIME.COMMUNITY_STALE_TIME,
  })
}

// Community 상세 조회
export function useCommunity(id: string) {
  return useQuery({
    queryKey: communityKeys.detail(id),
    queryFn: () => apiClient.get<Community>(`/communities/${id}`),
    enabled: !!id,
    staleTime: REALTIME.COMMUNITY_STALE_TIME,
  })
}

// Community 메시지 조회
export function useCommunityMessages(communityId: string) {
  return useQuery({
    queryKey: communityQueryKeys.messages(communityId),
    queryFn: () => apiClient.get<CommunityMessage[]>(`/communities/${communityId}/messages`),
    enabled: !!communityId,
    staleTime: REALTIME.MESSAGE_STALE_TIME,
  })
}

// Community 메모 조회
export function useCommunityMemos(communityId: string) {
  return useQuery({
    queryKey: communityQueryKeys.memos(communityId),
    queryFn: () => apiClient.get<CommunityMemo[]>(`/communities/${communityId}/memos`),
    enabled: !!communityId,
    staleTime: REALTIME.MEMO_STALE_TIME,
  })
}

// Community 파일 조회
export function useCommunityFiles(communityId: string) {
  return useQuery({
    queryKey: communityQueryKeys.files(communityId),
    queryFn: () => apiClient.get<CommunityFile[]>(`/communities/${communityId}/files`),
    enabled: !!communityId,
    staleTime: REALTIME.FILE_STALE_TIME,
  })
}

// Community 생성
export function useCreateCommunity() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateCommunityInput) => apiClient.post<Community>('/communities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityKeys.lists() })
    },
  })
}

// 메시지 전송
export function useSendMessage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ communityId, content }: { communityId: string; content: string }) =>
      apiClient.post<CommunityMessage>(`/communities/${communityId}/messages`, { content }),
    onSuccess: (newMessage, { communityId }) => {
      queryClient.setQueryData(
        communityQueryKeys.messages(communityId),
        (old: CommunityMessage[] = []) => [...old, newMessage]
      )
    },
  })
}

// 메모 생성
export function useCreateMemo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      communityId, 
      data 
    }: { 
      communityId: string; 
      data: CreateMemoInput
    }) =>
      apiClient.post<CommunityMemo>(`/communities/${communityId}/memos`, data),
    onSuccess: (newMemo, { communityId }) => {
      queryClient.setQueryData(
        communityQueryKeys.memos(communityId),
        (old: CommunityMemo[] = []) => [newMemo, ...old]
      )
    },
  })
}

// 메모 수정
export function useUpdateMemo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      communityId, 
      memoId, 
      data 
    }: { 
      communityId: string; 
      memoId: string;
      data: CreateMemoInput
    }) =>
      apiClient.put<CommunityMemo>(`/communities/${communityId}/memos/${memoId}`, data),
    onSuccess: (updatedMemo, { communityId }) => {
      queryClient.setQueryData(
        communityQueryKeys.memos(communityId),
        (old: CommunityMemo[] = []) => 
          old.map(memo => memo.id === updatedMemo.id ? updatedMemo : memo)
      )
    },
  })
}

// 메모 삭제
export function useDeleteMemo() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ communityId, memoId }: { communityId: string; memoId: string }) =>
      apiClient.delete(`/communities/${communityId}/memos/${memoId}`),
    onSuccess: (_, { communityId, memoId }) => {
      queryClient.setQueryData(
        communityQueryKeys.memos(communityId),
        (old: CommunityMemo[] = []) => old.filter(memo => memo.id !== memoId)
      )
    },
  })
}

// 파일 업로드
export function useUploadFile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      communityId, 
      file, 
      description 
    }: { 
      communityId: string; 
      file: File; 
      description: string 
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('description', description)
      
      return fetch(`/api/communities/${communityId}/files`, {
        method: 'POST',
        body: formData
      }).then(response => {
        if (!response.ok) {
          throw new Error('파일 업로드에 실패했습니다')
        }
        return response.json()
      })
    },
    onSuccess: (uploadedFile, { communityId }) => {
      queryClient.setQueryData(
        communityQueryKeys.files(communityId),
        (old: CommunityFile[] = []) => [uploadedFile, ...old]
      )
    },
  })
}