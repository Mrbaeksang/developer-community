// 커뮤니티 관련 타입 정의

import type { Database } from './database.types'

// 데이터베이스 enum 타입 별칭
export type CommunityVisibility = Database['public']['Enums']['community_visibility']
export type JoinRequestStatus = Database['public']['Enums']['join_request_status']
export type CommunityPostType = Database['public']['Enums']['community_post_type']

export interface Community {
  id: string
  name: string
  slug: string
  description: string
  icon_url?: string
  cover_image?: string
  visibility: CommunityVisibility
  max_members: number
  tags?: string[]
  created_by: string | null
  created_at: string
  updated_at?: string
  // 추가 계산된 필드들
  member_count?: number
  is_member?: boolean
  user_role?: string | null
  members?: CommunityMember[]
  owner?: CommunityOwner
}

export interface CommunitySettings {
  enable_chat: boolean
  enable_memos: boolean
  enable_files: boolean
  enable_posts: boolean
  require_approval: boolean
}

export interface CommunityMember {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  role: string
  joined_at: string
  is_online: boolean
  is_current_user?: boolean
}

export interface CommunityOwner {
  id: string
  username: string
  display_name: string
  avatar_url: string
}

export interface CommunityMessage {
  id: string
  user_id: string
  username: string
  content: string
  created_at: string
}

export interface CommunityMemo {
  id: string
  author_id: string
  author: string
  title: string
  content: string
  is_pinned: boolean
  tags: string[]
  created_at: string
  updated_at?: string
}

export interface CommunityFile {
  id: string
  community_id: string
  uploaded_by: string
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  category?: string
  allowed_mime_types?: string[]
  max_file_size?: number
  created_at: string
  // 추가 계산된 필드들
  uploaded_by_username?: string
  description?: string
  download_count?: number
}

// 폼 입력 타입들
export interface CreateCommunityInput {
  name: string
  slug: string
  description: string
  visibility: CommunityVisibility
  max_members: number
  icon_url?: string
  cover_image?: string
  tags?: string[]
  [key: string]: unknown
}

export interface CreateMemoInput {
  title: string
  content: string
  tags: string[]
  is_pinned: boolean
  [key: string]: unknown
}

export interface SendMessageInput {
  content: string
  [key: string]: unknown
}

export interface UploadFileInput {
  file: File
  description: string
  [key: string]: unknown
}

// 커뮤니티 게시글 타입들
export interface CommunityPost {
  id: string
  community_id: string
  author_id: string
  title: string
  content: string
  excerpt?: string
  post_type: CommunityPostType
  is_pinned: boolean
  like_count: number
  comment_count: number
  view_count: number
  tags?: string[]
  created_at: string
  updated_at: string
  author?: {
    id: string
    username: string
    avatar_url?: string
    display_name?: string
  }
  comments?: CommunityPostComment[]
}

export interface CommunityPostComment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  author?: {
    id: string
    username: string
    avatar_url?: string
  }
}

export interface CommunityStats {
  community_id: string
  total_posts: number
  total_messages: number
  total_memos: number
  total_files: number
  last_activity_at: string
  activity_score: number
  updated_at: string
}

export interface CommunityWithStats extends Community {
  community_stats?: CommunityStats[]
  recommendation_score?: number
}

export interface CreateCommunityPostInput {
  title: string
  content: string
  [key: string]: unknown
}

// 커뮤니티 가입 요청 타입들
export interface CommunityJoinRequest {
  id: string
  community_id: string
  user_id: string
  message?: string
  status: JoinRequestStatus
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  user?: {
    id: string
    username: string
    avatar_url?: string
    display_name?: string
  }
}

export interface CreateJoinRequestInput {
  community_id: string
  message?: string
}

// 필터 타입들
export interface CommunityFilters {
  visibility?: CommunityVisibility
  tags?: string[]
  search?: string
  limit?: number
  page?: number
  [key: string]: unknown
}