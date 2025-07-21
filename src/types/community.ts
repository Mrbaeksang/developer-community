// 커뮤니티 관련 타입 정의

export interface Community {
  id: string
  name: string
  slug: string
  description: string
  avatar_url?: string
  is_public: boolean
  is_default: boolean
  member_count: number
  max_members?: number
  owner_id: string
  created_at: string
  settings: CommunitySettings
  is_member: boolean
  user_role: string | null
  members: CommunityMember[]
  owner: CommunityOwner
}

export interface CommunitySettings {
  enable_chat: boolean
  enable_memos: boolean
  enable_files: boolean
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
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  uploaded_by: string
  uploaded_by_id: string
  description: string
  download_count: number
  created_at: string
}

// 폼 입력 타입들
export interface CreateCommunityInput {
  name: string
  slug: string
  description: string
  is_public: boolean
  max_members: number
  enable_chat: boolean
  enable_memos: boolean
  enable_files: boolean
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

// 필터 타입들
export interface CommunityFilters {
  type?: string
  limit?: number
  page?: number
  [key: string]: unknown
}