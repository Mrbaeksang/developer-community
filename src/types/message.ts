/**
 * 메시지 관련 타입 정의
 */

import type { Database } from './database.types'
import type { User } from './auth'

// 메시지 인터페이스
export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  thread_id?: string
  is_read: boolean
  created_at: string
  updated_at?: string
  
  // 관계 데이터
  sender?: User
  receiver?: User
  thread?: MessageThread
}

// 메시지 스레드
export interface MessageThread {
  id: string
  participants: string[]
  last_message?: Message
  last_message_at?: string
  unread_count: number
  created_at: string
  updated_at?: string
}

// 메시지 목록 응답
export interface MessageListResponse {
  messages: Message[]
  threads: MessageThread[]
  total: number
  unread_count: number
  has_more: boolean
}

// 메시지 필터
export interface MessageFilters {
  thread_id?: string
  sender_id?: string
  receiver_id?: string
  is_read?: boolean
  limit?: number
  offset?: number
  sort?: 'created_at' | 'updated_at'
  order?: 'asc' | 'desc'
}

// 메시지 생성 입력
export interface CreateMessageInput {
  receiver_id: string
  content: string
  thread_id?: string
}

// 메시지 생성 데이터 (API 요청용)
export interface CreateMessageData {
  receiver_id: string
  content: string
  thread_id?: string
}

// 메시지 업데이트
export interface UpdateMessageInput {
  is_read?: boolean
}

// 메시지 통계
export interface MessageStats {
  total_messages: number
  unread_messages: number
  total_threads: number
  active_threads: number
}