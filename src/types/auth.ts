/**
 * 인증 관련 타입 정의
 */

// 기본 사용자 타입
export interface User {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  role: 'admin' | 'user'
  is_email_verified: boolean
  email_verified_at?: string
  last_sign_in_at?: string
  created_at: string
  updated_at: string
  
  // 프로필 정보
  bio?: string
  website?: string
  location?: string
  social_links?: SocialLinks
  
  // 설정
  preferences?: UserPreferences
}

// 소셜 링크
export interface SocialLinks {
  github?: string
  twitter?: string
  linkedin?: string
  instagram?: string
  discord?: string
}

// 사용자 설정
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: NotificationSettings
  privacy: PrivacySettings
}

// 알림 설정
export interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  community_invites: boolean
  post_likes: boolean
  post_comments: boolean
  system_updates: boolean
}

// 개인정보 설정
export interface PrivacySettings {
  profile_visibility: 'public' | 'private'
  show_email: boolean
  show_activity: boolean
  allow_messages: boolean
}

// 로그인 입력
export interface LoginInput {
  email: string
  password: string
  remember_me?: boolean
  [key: string]: unknown
}

// 회원가입 입력
export interface SignupInput {
  email: string
  password: string
  password_confirmation: string
  username?: string
  full_name?: string
  terms_accepted: boolean
  newsletter_subscription?: boolean
  [key: string]: unknown
}

// 프로필 업데이트 입력
export interface UpdateProfileInput {
  username?: string
  full_name?: string
  bio?: string
  website?: string
  location?: string
  avatar_url?: string
  social_links?: Partial<SocialLinks>
  preferences?: Partial<UserPreferences>
  [key: string]: unknown
}

// 인증 응답
export interface AuthResponse {
  user: User
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type: 'Bearer'
}

// 세션 정보
export interface Session {
  user: User
  access_token: string
  refresh_token?: string
  expires_at: string
  is_valid: boolean
}

// 비밀번호 재설정 요청
export interface PasswordResetRequest {
  email: string
}

// 비밀번호 재설정 확인
export interface PasswordResetConfirm {
  token: string
  password: string
  password_confirmation: string
}

// 이메일 인증
export interface EmailVerification {
  token: string
  email?: string
}

// OAuth 프로바이더
export type OAuthProvider = 'google' | 'github' | 'discord'

// OAuth 응답
export interface OAuthResponse {
  provider: OAuthProvider
  redirect_url: string
  state?: string
}

// 사용자 역할
export type UserRole = 'admin' | 'user'

// 사용자 상태
export type UserStatus = 'active' | 'inactive' | 'banned' | 'pending'

// 인증 에러 타입
export interface AuthError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// 계정 삭제 요청
export interface DeleteAccountRequest {
  password: string
  reason?: string
  feedback?: string
}

// 2FA 설정
export interface TwoFactorSettings {
  enabled: boolean
  backup_codes?: string[]
  totp_secret?: string
}

// 보안 로그
export interface SecurityLog {
  id: string
  user_id: string
  action: string
  ip_address: string
  user_agent: string
  location?: string
  created_at: string
}

// 활성 세션
export interface ActiveSession {
  id: string
  user_id: string
  device: string
  browser: string
  ip_address: string
  location?: string
  last_activity: string
  is_current: boolean
  created_at: string
}