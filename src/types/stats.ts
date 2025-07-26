/**
 * 통계 관련 타입 정의
 */

// 사이트 전체 통계
export interface SiteStats {
  total_users: number
  active_users: number
  total_posts: number
  total_comments: number
  total_likes: number
  total_communities: number
  
  // 성장률
  growth_rates: {
    users: GrowthRate
    posts: GrowthRate
    engagement: GrowthRate
  }
  
  // 인기 컨텐츠
  popular_posts: PopularPost[]
  active_communities: ActiveCommunity[]
  top_contributors: TopContributor[]
}

// 성장률
export interface GrowthRate {
  daily: number
  weekly: number
  monthly: number
  trend: 'up' | 'down' | 'stable'
}

// 인기 게시글
export interface PopularPost {
  id: string
  title: string
  author_name: string
  view_count: number
  like_count: number
  comment_count: number
  engagement_score: number
}

// 활발한 커뮤니티
export interface ActiveCommunity {
  id: string
  name: string
  member_count: number
  post_count: number
  message_count: number
  activity_score: number
}

// 상위 기여자
export interface TopContributor {
  user_id: string
  username: string
  display_name?: string
  avatar_url?: string
  post_count: number
  comment_count: number
  like_count: number
  contribution_score: number
}

// 기간별 통계 필터
export interface StatsFilters {
  period?: 'day' | 'week' | 'month' | 'year' | 'all'
  start_date?: string
  end_date?: string
}

// 관리자 통계
export interface AdminStats extends SiteStats {
  pending_posts: number
  reported_content: number
  banned_users: number
  system_health: SystemHealth
  
  // 상세 분석
  user_analytics: UserAnalytics
  content_analytics: ContentAnalytics
  engagement_analytics: EngagementAnalytics
}

// 시스템 상태
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  error_rate: number
  response_time: number
  storage_usage: {
    used: number
    total: number
    percentage: number
  }
}

// 사용자 분석
export interface UserAnalytics {
  new_users_today: number
  active_users_today: number
  user_retention_rate: number
  average_session_duration: number
  user_distribution: {
    by_role: Record<string, number>
    by_join_date: Record<string, number>
  }
}

// 콘텐츠 분석
export interface ContentAnalytics {
  posts_by_category: Record<string, number>
  posts_by_status: Record<string, number>
  average_post_length: number
  content_quality_score: number
  trending_topics: string[]
}

// 참여도 분석
export interface EngagementAnalytics {
  average_likes_per_post: number
  average_comments_per_post: number
  engagement_rate: number
  peak_activity_hours: number[]
  user_interaction_matrix: Record<string, number>
}