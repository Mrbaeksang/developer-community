/**
 * 게시글 관련 타입 정의
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts, knowledge_posts 별도 타입 없음!
 * - ✅ 모든 게시글은 Post 타입 사용 (posts 테이블)
 * - 📌 board_type_id로 게시판 구분:
 *   - 지식공유: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885'
 *   - 자유게시판: '00f8f32b-faca-4947-94f5-812a0bb97c39'
 * 
 * ⚠️ 주의: FreePost, KnowledgePost 같은 별도 타입 없음!
 * 모든 게시글은 동일한 Post 인터페이스 사용
 */

import type { Database } from './database.types'
import type { UserRole } from './auth'

// 데이터베이스 enum 타입 별칭
export type PostStatus = Database['public']['Enums']['post_status']

// 기본 게시글 타입
export interface Post {
  id: string
  board_type_id: string
  category_id: string
  author_id: string
  
  // 게시글 내용
  title: string
  content: string
  excerpt?: string
  
  // 작성자 정보 (비정규화)
  author_username?: string
  author_display_name?: string
  author_avatar_url?: string
  
  // 메타 데이터
  featured_image?: string
  seo_title?: string
  seo_description?: string
  
  // 상태 및 설정
  status: PostStatus
  is_featured: boolean
  is_pinned: boolean
  
  // 통계 (자동 계산)
  like_count: number
  comment_count: number
  view_count: number
  
  // 태그
  tags: string[]
  
  // 시간 정보
  created_at: string
  updated_at: string
  published_at?: string
  
  // 추가 계산된 필드들
  is_liked?: boolean
  
  // 관계 데이터
  board_type?: BoardType
  category: Category
  author: Author
  comments?: Comment[]
}

// 게시판 타입
export interface BoardType {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  requires_approval: boolean
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

// 게시글 카테고리
export interface Category {
  id: string
  board_type_id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  is_active: boolean
  order_index: number
  created_at: string
}

// 게시글 작성자
export interface Author {
  id: string
  email: string
  username?: string
  display_name?: string
  avatar_url?: string
  bio?: string
  role: UserRole
}

// 댓글
export interface Comment {
  id: string
  content: string
  post_id: string
  author_id: string
  parent_id?: string
  created_at: string
  updated_at: string
  
  // 관계 데이터
  author: Author
  replies?: Comment[]
  reply_count: number
}

// 게시글 필터링
export interface PostFilters {
  board_type?: string
  category?: string
  status?: PostStatus
  author?: string
  tags?: string[]
  featured?: boolean
  pinned?: boolean
  limit?: number
  offset?: number
  sort?: 'created_at' | 'updated_at' | 'published_at' | 'view_count' | 'like_count'
  order?: 'asc' | 'desc'
  search?: string
  [key: string]: unknown
}

// 게시글 생성 입력
export interface CreatePostInput {
  board_type_id: string
  category_id: string
  title: string
  content: string
  excerpt?: string
  tags: string[]
  featured_image?: string
  seo_title?: string
  seo_description?: string
  is_featured?: boolean
  is_pinned?: boolean
  status?: Extract<PostStatus, 'draft' | 'pending'>
  [key: string]: unknown
}

// 게시글 수정 입력
export interface UpdatePostInput {
  board_type_id?: string
  category_id?: string
  title?: string
  content?: string
  excerpt?: string
  tags?: string[]
  featured_image?: string
  seo_title?: string
  seo_description?: string
  is_featured?: boolean
  is_pinned?: boolean
  status?: PostStatus
  [key: string]: unknown
}

// 댓글 생성 입력
export interface CreateCommentInput {
  content: string
  parent_id?: string
  [key: string]: unknown
}

// 게시글 통계
export interface PostStats {
  total_posts: number
  published_posts: number
  pending_posts: number
  draft_posts: number
  total_views: number
  total_likes: number
  total_comments: number
  categories_with_counts: Array<{
    category: Category
    post_count: number
  }>
  popular_tags: Array<{
    tag: string
    count: number
  }>
}

// 게시글 검색 결과
export interface PostSearchResult {
  posts: Post[]
  total: number
  query: string
  filters: PostFilters
}

// 관리자용 게시글 목록
export interface AdminPostListItem {
  id: string
  board_type_id: string
  category_id: string
  title: string
  excerpt?: string
  author: Author
  board_type: BoardType
  category: Category
  status: PostStatus
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  published_at?: string
}