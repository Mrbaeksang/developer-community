// 공통 타입 정의
import type { Database } from './database.types'

// Database 타입에서 enum 타입 추출
export type UserRole = Database['public']['Enums']['user_role']

// User type has been moved to auth.ts to avoid duplication
// Import from '@/types/auth' instead

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