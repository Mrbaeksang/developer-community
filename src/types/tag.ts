/**
 * 태그 관련 타입 정의
 */

import type { Database } from './database.types'

// 태그 인터페이스
export interface Tag {
  id: string
  name: string
  slug: string
  description?: string
  usage_count: number
  created_at: string
  updated_at?: string
}

// 태그 생성 입력
export interface CreateTagInput {
  name: string
  slug: string
  description?: string
}

// 태그 업데이트 입력
export interface UpdateTagInput {
  name?: string
  slug?: string
  description?: string
}

// 태그 목록 응답
export interface TagListResponse {
  tags: Tag[]
  total: number
}

// 인기 태그 응답
export interface PopularTag {
  id: string
  name: string
  slug: string
  usage_count: number
  trend: 'up' | 'down' | 'stable'
  trend_percentage?: number
}

// 태그 필터
export interface TagFilters {
  search?: string
  limit?: number
  offset?: number
  sort?: 'name' | 'usage_count' | 'created_at'
  order?: 'asc' | 'desc'
}

// 태그 통계
export interface TagStats {
  total_tags: number
  active_tags: number
  trending_tags: PopularTag[]
  most_used_tags: Tag[]
}