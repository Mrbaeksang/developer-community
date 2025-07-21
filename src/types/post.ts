/**
 * 게시글 관련 타입 정의
 */

// 기본 게시글 타입
export interface Post {
  id: string
  title: string
  content: string
  excerpt?: string
  slug?: string
  status: 'draft' | 'pending' | 'published' | 'rejected'
  category_id: string
  author_id: string
  tags: string[]
  featured_image?: string
  is_featured: boolean
  is_pinned: boolean
  view_count: number
  like_count: number
  comment_count: number
  is_liked?: boolean
  created_at: string
  updated_at: string
  published_at?: string
  
  // 관계 데이터
  category: Category
  author: Author
  comments?: Comment[]
}

// 게시글 카테고리
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  post_count: number
  created_at: string
}

// 게시글 작성자
export interface Author {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  role: string
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
  category?: string
  status?: string
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
  title: string
  content: string
  excerpt?: string
  category_id: string
  tags: string[]
  featured_image?: string
  is_featured?: boolean
  is_pinned?: boolean
  status?: 'draft' | 'pending'
  [key: string]: unknown
}

// 게시글 수정 입력
export interface UpdatePostInput {
  title?: string
  content?: string
  excerpt?: string
  category_id?: string
  tags?: string[]
  featured_image?: string
  is_featured?: boolean
  is_pinned?: boolean
  status?: 'draft' | 'pending' | 'published' | 'rejected'
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
  title: string
  author: Author
  category: Category
  status: Post['status']
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  published_at?: string
}