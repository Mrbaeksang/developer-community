// 공통 타입 정의

export interface User {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
  email?: string
  role?: 'admin' | 'user'
  created_at: string
}

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

export interface ErrorResponse {
  error: string
  message?: string
  code?: string
}

// 폼 상태 관리
export interface FormState {
  isLoading: boolean
  error: string | null
}

// 모달 props 공통 인터페이스
export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 검색 및 필터 공통 타입
export interface SearchFilters {
  query?: string
  page?: number
  limit?: number
}

export interface SortOptions {
  field: string
  order: 'asc' | 'desc'
}

// 태그 관리
export interface Tag {
  id: string
  name: string
  count?: number
}

export interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  maxTags?: number
  placeholder?: string
}