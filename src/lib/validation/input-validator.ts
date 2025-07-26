// 입력 검증 유틸리티
import { z } from 'zod'
import { sanitizeHTML as sanitizeHTMLFromLib } from '@/lib/sanitize'

// 검증 에러 클래스
export class ValidationError extends Error {
  constructor(
    public field: string,
    public message: string,
    public value?: unknown
  ) {
    super(`${field}: ${message}`)
    this.name = 'ValidationError'
  }
}

// 검증 결과 타입
export interface ValidationResult<T = unknown> {
  valid: boolean
  errors: ValidationError[]
  sanitized?: T
}

// 공통 검증 규칙
export const validators = {
  // 필수 필드 검증
  required: (value: unknown, field: string): void => {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(field, '필수 입력 항목입니다')
    }
  },

  // 문자열 길이 검증
  stringLength: (value: string, field: string, min: number, max: number): void => {
    if (typeof value !== 'string') {
      throw new ValidationError(field, '문자열이어야 합니다')
    }
    
    const length = value.trim().length
    if (length < min) {
      throw new ValidationError(field, `최소 ${min}자 이상이어야 합니다`)
    }
    if (length > max) {
      throw new ValidationError(field, `최대 ${max}자까지 가능합니다`)
    }
  },

  // 이메일 검증
  email: (value: string, field: string): void => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      throw new ValidationError(field, '올바른 이메일 형식이 아닙니다')
    }
  },

  // URL 검증
  url: (value: string, field: string): void => {
    try {
      const url = new URL(value)
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new ValidationError(field, 'HTTP(S) 프로토콜만 허용됩니다')
      }
    } catch {
      throw new ValidationError(field, '올바른 URL 형식이 아닙니다')
    }
  },

  // 숫자 범위 검증
  numberRange: (value: number, field: string, min: number, max: number): void => {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(field, '숫자여야 합니다')
    }
    if (value < min || value > max) {
      throw new ValidationError(field, `${min}에서 ${max} 사이의 값이어야 합니다`)
    }
  },

  // 배열 검증
  array: (value: unknown, field: string, minLength = 0, maxLength = Infinity): void => {
    if (!Array.isArray(value)) {
      throw new ValidationError(field, '배열이어야 합니다')
    }
    if (value.length < minLength) {
      throw new ValidationError(field, `최소 ${minLength}개 이상이어야 합니다`)
    }
    if (value.length > maxLength) {
      throw new ValidationError(field, `최대 ${maxLength}개까지 가능합니다`)
    }
  },

  // enum 검증
  enum: <T>(value: T, field: string, allowedValues: readonly T[]): void => {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(field, `허용된 값: ${allowedValues.join(', ')}`)
    }
  },

  // 파일 타입 검증
  fileType: (mimeType: string, field: string, allowedTypes: string[]): void => {
    if (!allowedTypes.includes(mimeType)) {
      throw new ValidationError(field, `허용된 파일 형식: ${allowedTypes.join(', ')}`)
    }
  },

  // 파일 크기 검증
  fileSize: (size: number, field: string, maxSize: number): void => {
    if (size > maxSize) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1)
      throw new ValidationError(field, `파일 크기는 ${maxSizeMB}MB를 초과할 수 없습니다`)
    }
  }
}

// XSS 방지를 위한 HTML 새니타이징
export function sanitizeHTML(input: string): string {
  // Use the sanitizeHTML from lib/sanitize.ts which properly imports DOMPurify
  return sanitizeHTMLFromLib(input)
}

// 마크다운 새니타이징
export function sanitizeMarkdown(input: string): string {
  // 위험한 HTML 태그 제거
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    
  // 위험한 속성 제거
  sanitized = sanitized
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    
  return sanitized
}

// SQL 인젝션 방지를 위한 검증
export function sanitizeForSQL(input: string): string {
  // Supabase는 파라미터화된 쿼리를 사용하므로 기본적으로 안전
  // 추가 보호를 위한 기본 검증만 수행
  return input
    .replace(/['";\\]/g, '') // 위험한 문자 제거
    .trim()
}

// 전화번호 검증 및 정규화
export function sanitizePhoneNumber(input: string): string {
  // 숫자와 하이픈만 허용
  const cleaned = input.replace(/[^\d-]/g, '')
  
  // 한국 전화번호 패턴 검증
  const phoneRegex = /^(01[0-9]-?\d{3,4}-?\d{4}|0[2-9]\d?-?\d{3,4}-?\d{4})$/
  if (!phoneRegex.test(cleaned)) {
    throw new ValidationError('phone', '올바른 전화번호 형식이 아닙니다')
  }
  
  return cleaned
}

// 사용자명 검증
export function validateUsername(username: string): void {
  validators.required(username, 'username')
  validators.stringLength(username, 'username', 3, 20)
  
  // 영문, 숫자, 언더스코어만 허용
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(username)) {
    throw new ValidationError('username', '영문, 숫자, 언더스코어(_)만 사용 가능합니다')
  }
  
  // 예약어 체크
  const reserved = ['admin', 'root', 'system', 'moderator', 'support']
  if (reserved.includes(username.toLowerCase())) {
    throw new ValidationError('username', '사용할 수 없는 사용자명입니다')
  }
}

// API 입력 검증 헬퍼
export function validateInput<T = Record<string, unknown>>(
  input: unknown,
  schema: ValidationSchema
): { data: T; errors: ValidationError[] } {
  const errors: ValidationError[] = []
  const sanitized: Record<string, unknown> = {}
  
  // Type guard to ensure input is an object
  if (typeof input !== 'object' || input === null) {
    throw new ValidationError('input', '입력값은 객체여야 합니다')
  }
  
  const inputObj = input as Record<string, unknown>

  for (const [field, rules] of Object.entries(schema)) {
    const value = inputObj[field]
    
    try {
      // 필수 필드 체크
      if (rules.required) {
        validators.required(value, field)
      } else if (value === undefined || value === null) {
        // 선택적 필드이고 값이 없으면 스킵
        continue
      }

      // 타입별 검증 및 새니타이징
      let sanitizedValue = value

      if (rules.type === 'string') {
        if (rules.minLength || rules.maxLength) {
          validators.stringLength(
            value,
            field,
            rules.minLength || 0,
            rules.maxLength || Infinity
          )
        }
        
        // HTML 새니타이징
        if (rules.sanitize === 'html') {
          sanitizedValue = sanitizeHTML(value)
        } else if (rules.sanitize === 'markdown') {
          sanitizedValue = sanitizeMarkdown(value)
        } else if (rules.sanitize === 'sql') {
          sanitizedValue = sanitizeForSQL(value)
        } else {
          // 기본: trim만 수행
          sanitizedValue = value.trim()
        }
      }

      if (rules.type === 'email') {
        validators.email(value, field)
        sanitizedValue = value.toLowerCase().trim()
      }

      if (rules.type === 'url') {
        validators.url(value, field)
      }

      if (rules.type === 'number') {
        if (rules.min !== undefined || rules.max !== undefined) {
          validators.numberRange(
            value,
            field,
            rules.min || -Infinity,
            rules.max || Infinity
          )
        }
      }

      if (rules.type === 'array') {
        validators.array(value, field, rules.minItems, rules.maxItems)
        
        // 배열 아이템 검증
        if (rules.items && Array.isArray(value)) {
          sanitizedValue = value.map((item, index) => {
            try {
              const itemResult = validateInput(
                { item },
                { item: rules.items! }
              )
              return itemResult.data.item
            } catch (e) {
              if (e instanceof ValidationError) {
                throw new ValidationError(`${field}[${index}]`, e.message)
              }
              throw e
            }
          })
        }
      }

      if (rules.enum) {
        validators.enum(value, field, rules.enum)
      }

      if (rules.custom) {
        rules.custom(value, field)
      }

      sanitized[field] = sanitizedValue

    } catch (e) {
      if (e instanceof ValidationError) {
        errors.push(e)
      } else {
        errors.push(new ValidationError(field, '검증 중 오류가 발생했습니다'))
      }
    }
  }

  return { data: sanitized as T, errors }
}

// 검증 스키마 타입
export interface ValidationSchema {
  [field: string]: ValidationRule
}

export interface ValidationRule {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'email' | 'url'
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  enum?: readonly unknown[]
  sanitize?: 'html' | 'markdown' | 'sql'
  items?: ValidationRule
  minItems?: number
  maxItems?: number
  custom?: (value: unknown, field: string) => void
}