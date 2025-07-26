// Zod 기반 검증 스키마
import { z } from 'zod'

// 커스텀 에러 메시지
const errorMessages = {
  required: '필수 입력 항목입니다',
  email: '올바른 이메일 형식이 아닙니다',
  url: '올바른 URL 형식이 아닙니다',
  min: (min: number) => `최소 ${min}자 이상이어야 합니다`,
  max: (max: number) => `최대 ${max}자까지 가능합니다`,
  phone: '올바른 전화번호 형식이 아닙니다',
  username: '영문, 숫자, 언더스코어(_)만 사용 가능합니다',
}

// XSS 방지를 위한 HTML 새니타이징
export function sanitizeHTML(input: string): string {
  // 위험한 태그와 속성 제거
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
}

// 마크다운 새니타이징
export function sanitizeMarkdown(input: string): string {
  return sanitizeHTML(input) // 기본 HTML 새니타이징 적용
}

// SQL 인젝션 방지를 위한 검증
export function sanitizeForSQL(input: string): string {
  // Supabase는 파라미터화된 쿼리를 사용하므로 기본적으로 안전
  // 추가 보호를 위한 기본 검증만 수행
  return input
    .replace(/['";\\]/g, '') // 위험한 문자 제거
    .trim()
}

// 공통 스키마
export const commonSchemas = {
  // ID (UUID)
  id: z.string().uuid('올바른 ID 형식이 아닙니다'),
  
  // 이메일
  email: z.string()
    .email(errorMessages.email)
    .toLowerCase()
    .transform(val => val.trim()),
  
  // 비밀번호
  password: z.string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/, '비밀번호는 영문과 숫자를 포함해야 합니다'),
  
  // 사용자명
  username: z.string()
    .min(3, errorMessages.min(3))
    .max(20, errorMessages.max(20))
    .regex(/^[a-zA-Z0-9_]+$/, errorMessages.username)
    .refine(
      (val) => !['admin', 'root', 'system', 'moderator', 'support'].includes(val.toLowerCase()),
      '사용할 수 없는 사용자명입니다'
    ),
  
  // URL
  url: z.string().url(errorMessages.url),
  
  // 전화번호
  phone: z.string()
    .regex(
      /^(01[0-9]-?\d{3,4}-?\d{4}|0[2-9]\d?-?\d{3,4}-?\d{4})$/,
      errorMessages.phone
    ),
  
  // 페이지네이션
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  
  // 날짜
  date: z.string().datetime(),
  
  // 파일
  file: z.object({
    name: z.string().max(255),
    type: z.string(),
    size: z.number().max(10 * 1024 * 1024, '파일 크기는 10MB를 초과할 수 없습니다'),
  }),
}

// 게시글 스키마
export const postSchemas = {
  // 게시글 생성
  create: z.object({
    title: z.string()
      .min(1, errorMessages.required)
      .max(200, errorMessages.max(200))
      .transform(sanitizeHTML),
    content: z.string()
      .min(1, errorMessages.required)
      .max(50000, errorMessages.max(50000))
      .transform(sanitizeMarkdown),
    board_type_id: commonSchemas.id,
    category_id: commonSchemas.id,
    tags: z.array(z.string().max(50)).max(10).optional(),
    thumbnail_url: commonSchemas.url.optional(),
    excerpt: z.string()
      .max(500, errorMessages.max(500))
      .transform(sanitizeHTML)
      .optional(),
    status: z.enum(['draft', 'pending', 'published', 'rejected']).optional(),
  }),
  
  // 게시글 수정
  update: z.object({
    title: z.string()
      .min(1, errorMessages.required)
      .max(200, errorMessages.max(200))
      .transform(sanitizeHTML)
      .optional(),
    content: z.string()
      .min(1, errorMessages.required)
      .max(50000, errorMessages.max(50000))
      .transform(sanitizeMarkdown)
      .optional(),
    category_id: commonSchemas.id.optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    thumbnail_url: commonSchemas.url.optional().nullable(),
  }),
  
  // 게시글 목록 조회
  list: z.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit,
    category: z.string().optional(),
    search: z.string().max(100).optional(),
    sort: z.enum(['latest', 'popular', 'comments']).default('latest'),
  }),
}

// 댓글 스키마
export const commentSchemas = {
  // 댓글 생성
  create: z.object({
    content: z.string()
      .min(1, errorMessages.required)
      .max(1000, errorMessages.max(1000))
      .transform(sanitizeHTML),
    parent_id: commonSchemas.id.optional(),
  }),
  
  // 댓글 수정
  update: z.object({
    content: z.string()
      .min(1, errorMessages.required)
      .max(1000, errorMessages.max(1000))
      .transform(sanitizeHTML),
  }),
}

// 커뮤니티 스키마
export const communitySchemas = {
  // 커뮤니티 생성
  create: z.object({
    name: z.string()
      .min(2, errorMessages.min(2))
      .max(50, errorMessages.max(50))
      .transform(sanitizeHTML),
    description: z.string()
      .max(500, errorMessages.max(500))
      .transform(sanitizeHTML)
      .optional(),
    is_public: z.boolean().default(true),
    max_members: z.number().int().min(2).max(100).default(10),
  }),
  
  // 커뮤니티 메시지
  message: z.object({
    content: z.string()
      .min(1, errorMessages.required)
      .max(1000, errorMessages.max(1000))
      .transform(sanitizeHTML),
  }),
  
  // 커뮤니티 메모
  memo: z.object({
    title: z.string()
      .min(1, errorMessages.required)
      .max(100, errorMessages.max(100))
      .transform(sanitizeHTML),
    content: z.string()
      .min(1, errorMessages.required)
      .max(10000, errorMessages.max(10000))
      .transform(sanitizeMarkdown),
  }),
  
  // 파일 업로드
  fileUpload: z.object({
    file_name: z.string()
      .max(255, errorMessages.max(255))
      .regex(/^[^<>:"/\\|?*]+$/, '파일명에 사용할 수 없는 문자가 포함되어 있습니다'),
    file_size: z.number()
      .positive()
      .max(10 * 1024 * 1024, '파일 크기는 10MB를 초과할 수 없습니다'),
    mime_type: z.string()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9\/\-+.]+$/, '올바른 MIME 타입이 아닙니다'),
  }),
}

// 관리자 스키마
export const adminSchemas = {
  // 카테고리 생성/수정
  category: z.object({
    name: z.string()
      .min(1, errorMessages.required)
      .max(50, errorMessages.max(50))
      .transform(sanitizeHTML),
    slug: z.string()
      .min(1, errorMessages.required)
      .max(50, errorMessages.max(50))
      .regex(/^[a-z0-9-]+$/, 'URL에 사용할 수 있는 문자만 허용됩니다 (소문자, 숫자, 하이픈)'),
    description: z.string()
      .max(200, errorMessages.max(200))
      .transform(sanitizeHTML)
      .optional(),
    board_type_id: commonSchemas.id,
  }),
  
  // 게시글 거부
  rejectPost: z.object({
    reason: z.string()
      .min(10, errorMessages.min(10))
      .max(500, errorMessages.max(500))
      .transform(sanitizeHTML),
  }),
}

// 연락처 스키마
export const contactSchema = z.object({
  name: z.string()
    .min(2, errorMessages.min(2))
    .max(50, errorMessages.max(50))
    .transform(sanitizeHTML),
  email: commonSchemas.email,
  subject: z.string()
    .min(5, errorMessages.min(5))
    .max(100, errorMessages.max(100))
    .transform(sanitizeHTML),
  message: z.string()
    .min(10, errorMessages.min(10))
    .max(2000, errorMessages.max(2000))
    .transform(sanitizeHTML),
})

// 검색 스키마
export const searchSchema = z.object({
  q: z.string()
    .min(2, '검색어는 최소 2자 이상이어야 합니다')
    .max(100, errorMessages.max(100))
    .transform(val => sanitizeForSQL(val.trim())),
  type: z.enum(['all', 'knowledge', 'forum']).default('all'),
  page: commonSchemas.page,
  limit: commonSchemas.limit,
})

// 헬퍼 함수: Zod 에러를 사용자 친화적으로 변환
export function formatZodError(error: z.ZodError): {
  field: string
  message: string
}[] {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }))
}

// 헬퍼 함수: 안전한 JSON 파싱
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    
    if (!result.success) {
      const errors = formatZodError(result.error)
      return {
        data: null,
        error: errors.map(e => `${e.field}: ${e.message}`).join(', '),
      }
    }
    
    return { data: result.data, error: null }
  } catch (e) {
    return {
      data: null,
      error: '올바른 JSON 형식이 아닙니다',
    }
  }
}

// 헬퍼 함수: 쿼리 파라미터 파싱
export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { data: T | null; error: string | null } {
  const params = Object.fromEntries(searchParams.entries())
  const result = schema.safeParse(params)
  
  if (!result.success) {
    const errors = formatZodError(result.error)
    return {
      data: null,
      error: errors.map(e => `${e.field}: ${e.message}`).join(', '),
    }
  }
  
  return { data: result.data, error: null }
}