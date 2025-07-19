import { z } from 'zod'

/**
 * 이메일 유효성 검사
 */
export const emailSchema = z
  .string()
  .email('올바른 이메일 형식이 아닙니다')
  .min(1, '이메일을 입력해주세요')

/**
 * 비밀번호 유효성 검사
 */
export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
  .regex(/[A-Z]/, '대문자를 포함해야 합니다')
  .regex(/[a-z]/, '소문자를 포함해야 합니다')
  .regex(/[0-9]/, '숫자를 포함해야 합니다')

/**
 * 사용자명 유효성 검사
 */
export const usernameSchema = z
  .string()
  .min(3, '사용자명은 최소 3자 이상이어야 합니다')
  .max(20, '사용자명은 최대 20자까지 가능합니다')
  .regex(/^[a-zA-Z0-9_]+$/, '영문, 숫자, 언더스코어만 사용 가능합니다')

/**
 * 로그인 폼 스키마
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

/**
 * 회원가입 폼 스키마
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  username: usernameSchema,
  displayName: z.string().min(1, '표시 이름을 입력해주세요').max(50),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
})

/**
 * 블로그 포스트 스키마
 */
export const blogPostSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  content: z.string().min(10, '내용은 최소 10자 이상이어야 합니다'),
  categoryId: z.string().uuid('카테고리를 선택해주세요'),
  excerpt: z.string().max(300).optional(),
  coverImage: z.string().url().optional(),
})

/**
 * 댓글 스키마
 */
export const commentSchema = z.object({
  content: z.string().min(1, '댓글을 입력해주세요').max(1000),
})

/**
 * 팀 생성 스키마
 */
export const createTeamSchema = z.object({
  name: z.string().min(1, '팀 이름을 입력해주세요').max(50),
  description: z.string().max(200).optional(),
  maxMembers: z.number().min(2).max(10).default(4),
})

/**
 * 태스크 생성 스키마
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
})