/**
 * 통합 API 훅 모듈
 * 
 * 이 파일은 모든 API 훅들을 중앙에서 re-export하여
 * 기존 컴포넌트들의 import 경로를 유지합니다.
 */

// 기본 API 클라이언트와 유틸리티
export { 
  apiClient, 
  createQueryKeys, 
  useInvalidateQueries, 
  usePrefetchQuery,
  getErrorMessage 
} from './api/base'

// 커뮤니티 관련 API 훅들
export { 
  communityKeys,
  communityQueryKeys,
  useCommunities,
  useCommunity,
  useCommunityMessages,
  useCommunityMemos,
  useCommunityFiles,
  useCreateCommunity,
  useSendMessage,
  useCreateMemo,
  useUpdateMemo,
  useDeleteMemo,
  useUploadFile
} from './api/communities'

// 게시글 관련 API 훅들
export {
  postKeys,
  commentKeys,
  postQueryKeys,
  usePosts,
  usePost,
  useSearchPosts,
  usePostComments,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useLikePost,
  useAddComment,
  useUpdateComment,
  useDeleteComment
} from './api/posts'

// 인증 관련 API 훅들
export {
  authKeys,
  userKeys,
  authQueryKeys,
  useCurrentUser,
  useUserProfile,
  useLogin,
  useSignup,
  useLogout,
  useUpdateProfile,
  useChangePassword,
  useResendEmailVerification,
  useRequestPasswordReset,
  useConfirmPasswordReset,
  useOAuthLogin,
  useDeleteAccount,
  useRefreshSession
} from './api/auth'

// 관리자 관련 API 훅들
export {
  adminKeys,
  statsKeys,
  categoryKeys,
  tagKeys,
  adminQueryKeys,
  useAdminStats,
  useAdminUsers,
  useAdminPosts,
  useAdminCommunities,
  useCategories,
  usePopularTags,
  useUpdateUserRole,
  useUpdateUserStatus,
  useUpdatePostStatus,
  useAdminDeletePost,
  useAdminDeleteCommunity,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useSystemSettings,
  useUpdateSystemSettings
} from './api/admin'

// 호환성을 위한 레거시 Query Keys (단계적으로 제거 예정)
export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    lists: () => ['posts', 'list'] as const,
    list: (filters: Record<string, unknown>) => ['posts', 'list', filters] as const,
    details: () => ['posts', 'detail'] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
    search: (query: string) => ['posts', 'search', query] as const,
  },
  categories: {
    all: ['categories'] as const,
    lists: () => ['categories', 'list'] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
  },
  communities: {
    all: ['communities'] as const,
    lists: () => ['communities', 'list'] as const,
    list: (filters: Record<string, unknown>) => ['communities', 'list', filters] as const,
    details: () => ['communities', 'detail'] as const,
    detail: (id: string) => ['communities', 'detail', id] as const,
  },
  stats: {
    all: ['stats'] as const,
    overview: () => ['stats', 'overview'] as const,
  },
  tags: {
    all: ['tags'] as const,
    popular: () => ['tags', 'popular'] as const,
  },
  users: {
    all: ['users'] as const,
    profile: (id: string) => ['users', 'profile', id] as const,
    current: () => ['users', 'current'] as const,
  },
  comments: {
    all: ['comments'] as const,
    lists: () => ['comments', 'list'] as const,
    list: (postId: string) => ['comments', 'list', postId] as const,
  },
  auth: {
    all: ['auth'] as const,
    currentUser: ['users', 'current'] as const,
  },
} as const