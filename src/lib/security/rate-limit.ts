// Rate Limiting 유틸리티
import { NextRequest } from 'next/server'

// Rate limit 저장소 (프로덕션에서는 Redis 사용)
const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitEntry {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  windowMs: number // 시간 창 (밀리초)
  max: number // 최대 요청 수
  message?: string // 에러 메시지
  keyGenerator?: (req: NextRequest) => string // 키 생성 함수
  skipSuccessfulRequests?: boolean // 성공한 요청 제외
  skipFailedRequests?: boolean // 실패한 요청 제외
}

// 기본 설정
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1분
  max: 100, // 분당 100개 요청
  message: 'Too many requests, please try again later.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}

// IP 주소 추출
export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('x-client-ip') ||
         'unknown'
}

// 기본 키 생성기
function defaultKeyGenerator(request: NextRequest): string {
  const ip = getClientIP(request)
  const path = request.nextUrl.pathname
  return `${ip}:${path}`
}

// Rate limit 체크
export function checkRateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: Date
  retryAfter?: number
} {
  const finalConfig = { ...defaultConfig, ...config }
  const keyGenerator = finalConfig.keyGenerator || defaultKeyGenerator
  const key = keyGenerator(request)
  const now = Date.now()
  
  // 기존 엔트리 가져오기 또는 새로 생성
  let entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime <= now) {
    // 새 시간 창 시작
    entry = {
      count: 1,
      resetTime: now + finalConfig.windowMs
    }
    rateLimitStore.set(key, entry)
  } else {
    // 카운트 증가
    entry.count++
  }
  
  // 한도 초과 체크
  const allowed = entry.count <= finalConfig.max
  const remaining = Math.max(0, finalConfig.max - entry.count)
  const resetTime = new Date(entry.resetTime)
  
  // 한도 초과 시 retry-after 계산
  const retryAfter = allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000)
  
  return {
    allowed,
    limit: finalConfig.max,
    remaining,
    resetTime,
    retryAfter
  }
}

// Rate limit 헤더 설정
export function setRateLimitHeaders(
  headers: Headers,
  rateLimitInfo: ReturnType<typeof checkRateLimit>
): void {
  headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
  headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
  headers.set('X-RateLimit-Reset', rateLimitInfo.resetTime.toISOString())
  
  if (rateLimitInfo.retryAfter) {
    headers.set('Retry-After', rateLimitInfo.retryAfter.toString())
  }
}

// 메모리 정리 (주기적으로 실행)
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  const keysToDelete: string[] = []
  
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime <= now) {
      keysToDelete.push(key)
    }
  })
  
  keysToDelete.forEach(key => rateLimitStore.delete(key))
}

// 5분마다 메모리 정리
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}

// API별 Rate limit 설정
export const rateLimitConfigs = {
  // 인증 관련 API - 더 엄격한 제한
  auth: {
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 15분에 5번
    message: '너무 많은 인증 시도입니다. 나중에 다시 시도해주세요.'
  },
  
  // 파일 업로드 - 리소스 집약적
  upload: {
    windowMs: 60 * 1000, // 1분
    max: 10, // 분당 10개
    message: '파일 업로드 한도를 초과했습니다.'
  },
  
  // 일반 API
  general: {
    windowMs: 60 * 1000, // 1분
    max: 100, // 분당 100개
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  },
  
  // 검색 API
  search: {
    windowMs: 60 * 1000, // 1분
    max: 30, // 분당 30개
    message: '검색 요청이 너무 많습니다.'
  }
}

// Rate limit 미들웨어 헬퍼
export function getRateLimitConfig(pathname: string): Partial<RateLimitConfig> {
  if (pathname.startsWith('/api/auth/')) {
    return rateLimitConfigs.auth
  }
  if (pathname.includes('/upload') || pathname.includes('/files')) {
    return rateLimitConfigs.upload
  }
  if (pathname.includes('/search')) {
    return rateLimitConfigs.search
  }
  return rateLimitConfigs.general
}