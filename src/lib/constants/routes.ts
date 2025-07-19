/**
 * 애플리케이션 라우트 상수
 */

// 공개 라우트
export const PUBLIC_ROUTES = {
  HOME: '/',
  BLOG: '/blog',
  BLOG_POST: (slug: string) => `/blog/${slug}`,
  BLOG_CATEGORY: (category: string) => `/blog/category/${category}`,
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
} as const

// 인증 필요 라우트
export const AUTHENTICATED_ROUTES = {
  DASHBOARD: '/dashboard',
  TEAMS: '/teams',
  TEAM_DETAIL: (id: string) => `/teams/${id}`,
  TEAM_CHAT: (id: string) => `/teams/${id}/chat`,
  TEAM_MEMOS: (id: string) => `/teams/${id}/memos`,
  TEAM_TASKS: (id: string) => `/teams/${id}/tasks`,
  PROFILE: '/profile',
} as const

// 관리자 라우트
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  BLOG_POSTS: '/admin/blog/posts',
  BLOG_POST_NEW: '/admin/blog/posts/new',
  BLOG_POST_EDIT: (id: string) => `/admin/blog/posts/${id}/edit`,
  BLOG_CATEGORIES: '/admin/blog/categories',
  TEAM_ROTATIONS: '/admin/teams/rotations',
  TEAM_MEMBERS: '/admin/teams/members',
} as const

// API 라우트
export const API_ROUTES = {
  // 인증
  AUTH_SIGNUP: '/api/auth/signup',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_ME: '/api/auth/me',
  
  // 블로그
  BLOG_POSTS: '/api/blog/posts',
  BLOG_POST: (id: string) => `/api/blog/posts/${id}`,
  BLOG_COMMENTS: (postId: string) => `/api/blog/posts/${postId}/comments`,
  
  // 팀
  TEAMS: '/api/teams',
  TEAM: (id: string) => `/api/teams/${id}`,
  TEAM_MEMBERS: (id: string) => `/api/teams/${id}/members`,
  
  // 업로드
  UPLOAD: '/api/upload',
} as const