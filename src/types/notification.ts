/**
 * 알림 관련 타입 정의
 */

import type { Database } from './database.types'
import type { User } from './auth'

// 알림 타입 enum
export type NotificationType = Database['public']['Enums']['notification_type']

// 알림 인터페이스
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  related_id?: string
  related_type?: string
  is_read: boolean
  created_at: string
  
  // 관계 데이터
  related_data?: {
    post?: {
      id: string
      title: string
      slug?: string
    }
    comment?: {
      id: string
      content: string
      post_id: string
    }
    user?: {
      id: string
      username?: string
      display_name?: string
      avatar_url?: string
    }
    community?: {
      id: string
      name: string
      slug: string
    }
  }
}

// 알림 목록 응답
export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unread_count: number
  has_more: boolean
}

// 알림 필터
export interface NotificationFilters {
  type?: NotificationType | NotificationType[]
  is_read?: boolean
  related_type?: string
  limit?: number
  offset?: number
  sort?: 'created_at'
  order?: 'asc' | 'desc'
}

// 알림 업데이트
export interface UpdateNotificationInput {
  is_read?: boolean
}

// 알림 생성 (내부용)
export interface CreateNotificationInput {
  user_id: string
  type: NotificationType
  title: string
  message: string
  related_id?: string
  related_type?: string
}