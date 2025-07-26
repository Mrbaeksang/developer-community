/**
 * 관리자 관련 타입 정의
 */

import type { User, NotificationType } from './auth'
import type { Post, Category, BoardType, PostStatus } from './post'
import type { Community } from './community'
import type { Database } from './database.types'

// Type aliases for enums
export type ApprovalAction = Database['public']['Enums']['approval_action']

// Re-export commonly used types
export type { Category, BoardType }

// 관리자 통계
export interface AdminStats {
  overview: {
    total_users: number
    total_posts: number
    total_communities: number
    total_comments: number
    pending_posts: number
    active_users_today: number
    new_users_today: number
    new_posts_today: number
    pending_approvals: number
    notifications_sent_today: number
  }
  
  user_stats: {
    total_users: number
    active_users: number
    inactive_users: number
    banned_users: number
    admin_users: number
    growth_rate: number
  }
  
  post_stats: {
    total_posts: number
    published_posts: number
    pending_posts: number
    rejected_posts: number
    draft_posts: number
    archived_posts: number
    average_views: number
    average_likes: number
    posts_by_board_type: Record<string, number>
  }
  
  community_stats: {
    total_communities: number
    public_communities: number
    private_communities: number
    average_members: number
    active_communities: number
  }
  
  engagement_stats: {
    total_likes: number
    total_comments: number
    total_views: number
    average_engagement_rate: number
  }
  
  growth_trends: {
    period: string
    users: number[]
    posts: number[]
    communities: number[]
    dates: string[]
  }
}

// 관리자용 사용자 정보
export interface AdminUser extends User {
  status: 'active' | 'inactive' | 'banned' | 'pending'
  last_activity_at?: string
  post_count: number
  comment_count: number
  community_count: number
  reports_count: number
  ban_reason?: string
  banned_at?: string
  banned_until?: string
}

// 관리자용 게시글 정보
export interface AdminPost extends Post {
  reports_count: number
  board_type: BoardType
  approvals?: PostApproval[]
  last_approval?: PostApproval
}

// 게시글 승인 정보
export interface PostApproval {
  id: string
  post_id: string
  admin_id: string
  action: ApprovalAction
  reason?: string
  admin_notes?: string
  created_at: string
  admin?: User
}

// 관리자용 커뮤니티 정보
export interface AdminCommunity extends Community {
  reports_count: number
  last_activity_at?: string
  message_count: number
  memo_count: number
  file_count: number
}

// 관리자 필터
export interface AdminFilters {
  search?: string
  status?: string
  role?: string
  sort?: string
  order?: 'asc' | 'desc'
  limit?: number
  offset?: number
  date_from?: string
  date_to?: string
}

// 게시판 타입 관리
export interface BoardTypeInput {
  name: string
  slug: string
  description?: string
  icon?: string
  requires_approval?: boolean
  is_active?: boolean
  order_index?: number
}

// 카테고리 생성 입력
export interface CreateCategoryInput {
  board_type_id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  is_active?: boolean
  order_index?: number
}

// 카테고리 수정 입력
export interface UpdateCategoryInput {
  name?: string
  slug?: string
  description?: string
  color?: string
  icon?: string
  is_active?: boolean
  order_index?: number
}

// 인기 태그
export interface PopularTag {
  tag: string
  count: number
  trend: 'up' | 'down' | 'stable'
}

// 신고 정보
export interface Report {
  id: string
  reporter_id: string
  reported_user_id?: string
  reported_post_id?: string
  reported_comment_id?: string
  reported_community_id?: string
  type: 'user' | 'post' | 'comment' | 'community'
  reason: string
  description?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by?: string
  reviewed_at?: string
  resolution?: string
  created_at: string
  
  // 관계 데이터
  reporter: User
  reported_user?: User
  reported_post?: Post
  reported_community?: Community
}

// 알림 관리
export interface AdminNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message?: string
  related_id?: string
  related_type?: string
  is_read: boolean
  created_at: string
  user?: User
}

// 시스템 설정
export interface SystemSettings {
  site: {
    name: string
    description: string
    logo_url?: string
    favicon_url?: string
    primary_color: string
    secondary_color: string
  }
  
  features: {
    user_registration: boolean
    board_types: BoardTypeSettings[]
    community_creation_enabled: boolean
    file_upload_enabled: boolean
    comments_enabled: boolean
    comment_likes_enabled: boolean
    notifications_enabled: boolean
    messages_enabled: boolean
  }
  
  limits: {
    max_file_size_mb: number
    max_community_members: number
    max_posts_per_day: number
    max_comments_per_post: number
  }
  
  content: {
    default_post_status: PostStatus
    auto_publish_trusted_users: boolean
    content_moderation: boolean
    spam_detection: boolean
    denormalized_author_info: boolean
  }
  
  notifications: {
    email_notifications: boolean
    admin_notification_email: string
    new_user_notification: boolean
    new_post_notification: boolean
    report_notification: boolean
  }
}

// 게시판 타입별 설정
export interface BoardTypeSettings {
  board_type_id: string
  board_type_name: string
  requires_approval: boolean
  auto_approve_roles: string[]
  max_posts_per_day?: number
  allowed_file_types?: string[]
}

// 관리 작업 로그
export interface AdminActionLog {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id?: string
  details: Record<string, unknown>
  created_at: string
  
  // 관계 데이터
  admin?: User
}

// 모니터링 메트릭
export interface SystemMetrics {
  performance: {
    avg_response_time: number
    error_rate: number
    uptime_percentage: number
  }
  
  database: {
    connection_count: number
    query_performance: number
    storage_usage_gb: number
  }
  
  resources: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number
  }
  
  security: {
    failed_login_attempts: number
    blocked_ips: string[]
    security_events: number
  }
}