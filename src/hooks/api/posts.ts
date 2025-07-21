/**
 * 게시글 관련 API 훅들
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, createQueryKeys } from './base'
import { CACHE_TIME } from '@/lib/constants/app'
import type { 
  Post, 
  PostFilters,
  CreatePostInput,
  UpdatePostInput,
  Comment,
  CreateCommentInput 
} from '@/types/post'

// Query Keys
export const postKeys = createQueryKeys('posts')
export const commentKeys = createQueryKeys('comments')

export const postQueryKeys = {
  ...postKeys,
  comments: (postId: string) => [...postKeys.detail(postId), 'comments'] as const,
  likes: (postId: string) => [...postKeys.detail(postId), 'likes'] as const,
}

// Posts 조회
export function usePosts(filters: PostFilters = {}) {
  return useQuery({
    queryKey: postKeys.list(filters),
    queryFn: () => apiClient.get<Post[]>('/posts', filters as Record<string, string>),
    staleTime: CACHE_TIME.MEDIUM,
  })
}

// Post 상세 조회
export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => apiClient.get<Post>(`/posts/${id}`),
    enabled: !!id,
    staleTime: CACHE_TIME.LONG,
  })
}

// Post 검색
export function useSearchPosts(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: postKeys.search(query),
    queryFn: () => apiClient.get<Post[]>('/posts/search', { q: query }),
    enabled: enabled && query.length >= 2,
    staleTime: CACHE_TIME.SHORT,
  })
}

// Post 댓글 조회
export function usePostComments(postId: string) {
  return useQuery({
    queryKey: postQueryKeys.comments(postId),
    queryFn: () => apiClient.get<Comment[]>(`/posts/${postId}/comments`),
    enabled: !!postId,
    staleTime: CACHE_TIME.SHORT,
  })
}

// Post 생성
export function useCreatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreatePostInput) => apiClient.post<Post>('/posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}

// Post 수정
export function useUpdatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostInput }) => 
      apiClient.put<Post>(`/posts/${id}`, data),
    onSuccess: (updatedPost, { id }) => {
      queryClient.setQueryData(postKeys.detail(id), updatedPost)
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}

// Post 삭제
export function useDeletePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/posts/${id}`),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: postKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}

// Post 좋아요/취소
export function useLikePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'like' | 'unlike' }) => {
      const method = action === 'like' ? 'POST' : 'DELETE'
      return apiClient.request<{ is_liked: boolean; like_count: number }>(`/posts/${postId}/like`, {
        method,
        headers: { 'Content-Type': 'application/json' }
      })
    },
    onSuccess: (data, { postId }) => {
      // 게시글 상세 데이터 업데이트
      queryClient.setQueryData(postKeys.detail(postId), (old: Post | undefined) => {
        if (!old) return old
        return {
          ...old,
          is_liked: data.is_liked,
          like_count: data.like_count
        }
      })
      
      // 게시글 목록 데이터도 무효화
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}

// 댓글 추가
export function useAddComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) => 
      apiClient.post<Comment>(`/posts/${postId}/comments`, { content }),
    onSuccess: (newComment, { postId }) => {
      // 댓글 목록에 새 댓글 추가
      queryClient.setQueryData(postQueryKeys.comments(postId), (old: Comment[] = []) => {
        return [...old, newComment]
      })
      
      // 게시글의 댓글 수 업데이트
      queryClient.setQueryData(postKeys.detail(postId), (old: Post | undefined) => {
        if (!old) return old
        return {
          ...old,
          comment_count: old.comment_count + 1
        }
      })
      
      // 게시글 목록도 무효화 (댓글 수 변경 반영)
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}

// 댓글 수정
export function useUpdateComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      postId, 
      commentId, 
      content 
    }: { 
      postId: string; 
      commentId: string; 
      content: string 
    }) => 
      apiClient.put<Comment>(`/posts/${postId}/comments/${commentId}`, { content }),
    onSuccess: (updatedComment, { postId }) => {
      queryClient.setQueryData(postQueryKeys.comments(postId), (old: Comment[] = []) =>
        old.map(comment => comment.id === updatedComment.id ? updatedComment : comment)
      )
    },
  })
}

// 댓글 삭제
export function useDeleteComment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) => 
      apiClient.delete(`/posts/${postId}/comments/${commentId}`),
    onSuccess: (_, { postId, commentId }) => {
      // 댓글 목록에서 제거
      queryClient.setQueryData(postQueryKeys.comments(postId), (old: Comment[] = []) =>
        old.filter(comment => comment.id !== commentId)
      )
      
      // 게시글의 댓글 수 업데이트
      queryClient.setQueryData(postKeys.detail(postId), (old: Post | undefined) => {
        if (!old) return old
        return {
          ...old,
          comment_count: Math.max(0, old.comment_count - 1)
        }
      })
      
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}