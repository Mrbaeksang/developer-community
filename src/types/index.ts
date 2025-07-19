// 데이터베이스 테이블 타입 정의

export interface Profile {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  bio?: string
  github_url?: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  description?: string
  avatar_url?: string
  is_public: boolean
  created_by: string
  created_at: string
  // 관계
  creator?: Profile
  member_count?: number
}

export interface GroupMember {
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  // 관계
  user?: Profile
  group?: Group
}

export interface Post {
  id: string
  title: string
  content: string // Markdown
  type: 'tech' | 'news' | 'discussion'
  group_id?: string
  author_id: string
  is_public: boolean
  created_at: string
  updated_at: string
  // 관계
  author?: Profile
  group?: Group
  tags?: Tag[]
  comment_count?: number
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  // 관계
  author?: Profile
  post?: Post
}

export interface Message {
  id: string
  group_id: string
  author_id: string
  content: string
  created_at: string
  // 관계
  author?: Profile
}

export interface Tag {
  id: string
  name: string
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

// 폼 입력 타입
export interface LoginInput {
  email: string
  password: string
}

export interface SignupInput extends LoginInput {
  username: string
  display_name?: string
}

export interface CreateGroupInput {
  name: string
  description?: string
  is_public: boolean
}

export interface CreatePostInput {
  title: string
  content: string
  type: 'tech' | 'news' | 'discussion'
  group_id?: string
  is_public: boolean
  tags?: string[]
}

export interface CreateCommentInput {
  content: string
}

export interface SendMessageInput {
  content: string
}

// Realtime 타입
export interface RealtimeMessage {
  event: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Message
  old: Message | null
}

export interface PresenceState {
  [key: string]: {
    user_id: string
    online_at: string
  }[]
}

// 필터 및 정렬 타입
export interface PostFilters {
  type?: 'tech' | 'news' | 'discussion'
  group_id?: string
  author_id?: string
  tags?: string[]
  is_public?: boolean
}

export interface PostSort {
  field: 'created_at' | 'updated_at' | 'comment_count'
  order: 'asc' | 'desc'
}

export interface GroupFilters {
  is_public?: boolean
  created_by?: string
  search?: string
}