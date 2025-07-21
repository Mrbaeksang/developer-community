/**
 * 애플리케이션 전역 상수 정의
 */

// 파일 업로드 제한
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ],
    ALL: ['*/*']
  }
} as const

// 태그 제한
export const TAGS = {
  MAX_COUNT: 5,
  MAX_LENGTH: 20,
  MIN_LENGTH: 1
} as const

// 텍스트 길이 제한
export const TEXT_LIMITS = {
  COMMUNITY_NAME: 50,
  COMMUNITY_DESCRIPTION: 200,
  MEMO_TITLE: 100,
  MEMO_CONTENT: 5000,
  MESSAGE_CONTENT: 1000,
  FILE_DESCRIPTION: 200,
  POST_TITLE: 100,
  POST_CONTENT: 10000,
  COMMENT_CONTENT: 500
} as const

// 커뮤니티 제한
export const COMMUNITY = {
  MIN_MEMBERS: 2,
  MAX_MEMBERS: 10,
  DEFAULT_MAX_MEMBERS: 5
} as const

// 페이지네이션
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  POSTS_PER_PAGE: 10,
  COMMENTS_PER_PAGE: 20,
  MESSAGES_PER_PAGE: 50
} as const

// 캐시 시간 (밀리초)
export const CACHE_TIME = {
  SHORT: 1 * 60 * 1000,      // 1분
  MEDIUM: 5 * 60 * 1000,     // 5분
  LONG: 30 * 60 * 1000,      // 30분
  VERY_LONG: 60 * 60 * 1000  // 1시간
} as const

// 실시간 업데이트 간격
export const REALTIME = {
  MESSAGE_STALE_TIME: 30 * 1000,    // 30초
  MEMO_STALE_TIME: 2 * 60 * 1000,   // 2분
  FILE_STALE_TIME: 5 * 60 * 1000,   // 5분
  COMMUNITY_STALE_TIME: 5 * 60 * 1000 // 5분
} as const

// API 응답 상태
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading'
} as const

// 사용자 역할
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  OWNER: 'owner',
  MEMBER: 'member'
} as const

// 게시글 상태
export const POST_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  REJECTED: 'rejected'
} as const

// 커뮤니티 가시성
export const COMMUNITY_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private'
} as const

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.'
} as const

// 성공 메시지
export const SUCCESS_MESSAGES = {
  COMMUNITY_CREATED: '커뮤니티가 성공적으로 생성되었습니다.',
  MEMO_SAVED: '메모가 저장되었습니다.',
  FILE_UPLOADED: '파일이 업로드되었습니다.',
  MESSAGE_SENT: '메시지가 전송되었습니다.',
  POST_CREATED: '게시글이 작성되었습니다.',
  COMMENT_ADDED: '댓글이 추가되었습니다.'
} as const

// 라우트 경로
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  COMMUNITIES: '/communities',
  COMMUNITY_CREATE: '/communities/create',
  COMMUNITY_DETAIL: (id: string) => `/communities/${id}`,
  POSTS: '/posts',
  POST_DETAIL: (id: string) => `/posts/${id}`,
  ADMIN: '/admin',
  PROFILE: '/profile'
} as const