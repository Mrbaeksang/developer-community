/**
 * 북마크 관련 타입 정의
 */

import type { Database } from './database.types'
import type { Post } from './post'
import type { User } from './auth'

// 북마크 인터페이스
export interface Bookmark {
  post_id: string
  user_id: string
  created_at: string
  
  // 관계 데이터
  post?: Post
  user?: User
}

// 북마크 목록 응답
export interface BookmarkListResponse {
  bookmarks: Bookmark[]
  total: number
  has_more: boolean
}

// 북마크 필터
export interface BookmarkFilters {
  user_id?: string
  board_type?: string
  category?: string
  limit?: number
  offset?: number
  sort?: 'created_at'
  order?: 'asc' | 'desc'
}

// 북마크 생성/삭제 응답
export interface BookmarkToggleResponse {
  bookmarked: boolean
  bookmark?: Bookmark
  message: string
}

// 북마크 통계
export interface BookmarkStats {
  total_bookmarks: number
  bookmarks_by_category: Array<{
    category_id: string
    category_name: string
    count: number
  }>
  recent_bookmarks: Bookmark[]
}