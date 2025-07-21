/**
 * 중앙화된 타입 export
 * 
 * 모든 타입 정의를 한 곳에서 import할 수 있도록 합니다.
 */

// 공통 타입 (User, Tag 제외 - 충돌 방지)
export type {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  FormState,
  ModalProps,
  SearchFilters,
  SortOptions,
  TagInputProps
} from './common'

// 커뮤니티 관련 타입
export type * from './community'

// 게시글 관련 타입
export type * from './post'

// 인증 관련 타입 (User는 여기서 가져옴)
export type * from './auth'

// 관리자 관련 타입
export type * from './admin'

// 호환성을 위한 레거시 타입들 (단계적으로 제거 예정)
/** @deprecated Use types from specific modules instead */
export interface Profile {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  github_url?: string
  created_at: string
}

/** @deprecated Use Community type instead */
export interface Group {
  id: string
  name: string
  description?: string
  avatar_url?: string
  is_public: boolean
  created_by: string
  created_at: string
  creator?: Profile
  member_count?: number
}

/** @deprecated Use CommunityMember type instead */
export interface GroupMember {
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  user?: Profile
  group?: Group
}

/** @deprecated Use CommunityMessage type instead */
export interface Message {
  id: string
  group_id: string
  author_id: string
  content: string
  created_at: string
  author?: Profile
}

/** @deprecated Use types from specific modules instead */
export interface Tag {
  id: string
  name: string
}

/** @deprecated Use CommunityMessage type instead */
export interface RealtimeMessage {
  event: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Message
  old: Message | null
}

/** @deprecated Use types from specific modules instead */
export interface PresenceState {
  [key: string]: {
    user_id: string
    online_at: string
  }[]
}

/** @deprecated Use PostSort type instead */
export interface PostSort {
  field: 'created_at' | 'updated_at' | 'comment_count'
  order: 'asc' | 'desc'
}

/** @deprecated Use CommunityFilters type instead */
export interface GroupFilters {
  is_public?: boolean
  created_by?: string
  search?: string
}