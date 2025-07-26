// CSRF 보호 유틸리티
import { NextRequest } from 'next/server'

// CSRF 토큰 생성 (Web Crypto API 사용)
export async function generateCSRFToken(): Promise<string> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// CSRF 토큰 검증 (타이밍 공격 방지)
export function validateCSRFToken(token: string | null, sessionToken: string | null): boolean {
  if (!token || !sessionToken) {
    return false
  }
  
  // 문자열 길이가 다르면 false
  if (token.length !== sessionToken.length) {
    return false
  }
  
  // 타이밍 공격 방지를 위한 상수 시간 비교
  let mismatch = 0
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ sessionToken.charCodeAt(i)
  }
  
  return mismatch === 0
}

// CSRF 보호 옵션
export interface CSRFProtectionOptions {
  excludePaths?: string[]
  customOrigins?: string[]
  requireToken?: boolean
}

// CSRF 보호 검증
export function validateCSRFProtection(
  request: NextRequest,
  options: CSRFProtectionOptions = {}
): { valid: boolean; reason?: string } {
  const { excludePaths = [], customOrigins = [], requireToken = false } = options
  const pathname = request.nextUrl.pathname
  
  // 제외 경로 확인
  if (excludePaths.some(path => pathname.startsWith(path))) {
    return { valid: true }
  }
  
  // GET, HEAD, OPTIONS 요청은 CSRF 검증 제외
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true }
  }
  
  // 1. Origin 헤더 검증
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  if (origin && host) {
    const expectedOrigins = [
      `https://${host}`,
      `http://${host}`,
      ...customOrigins
    ]
    
    // 개발 환경에서는 localhost 허용
    if (process.env.NODE_ENV === 'development') {
      expectedOrigins.push(
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001' // 다른 포트도 허용
      )
    }
    
    if (!expectedOrigins.includes(origin)) {
      return { 
        valid: false, 
        reason: `Invalid origin: ${origin}` 
      }
    }
  }
  
  // 2. Referer 헤더 검증 (Origin이 없는 경우 fallback)
  if (!origin) {
    const referer = request.headers.get('referer')
    if (!referer) {
      return { 
        valid: false, 
        reason: 'Missing origin and referer headers' 
      }
    }
    
    try {
      const refererUrl = new URL(referer)
      const expectedHost = request.headers.get('host')
      
      if (refererUrl.host !== expectedHost) {
        // 개발 환경 체크
        if (process.env.NODE_ENV === 'development' && 
            ['localhost:3000', '127.0.0.1:3000'].includes(refererUrl.host)) {
          return { valid: true }
        }
        
        return { 
          valid: false, 
          reason: `Invalid referer: ${referer}` 
        }
      }
    } catch (e) {
      return { 
        valid: false, 
        reason: 'Invalid referer URL format' 
      }
    }
  }
  
  // 3. Content-Type 검증
  const contentType = request.headers.get('content-type')
  const validContentTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data'
  ]
  
  if (contentType) {
    const isValidContentType = validContentTypes.some(type => 
      contentType.toLowerCase().includes(type)
    )
    
    if (!isValidContentType && !contentType.includes('text/plain')) {
      return { 
        valid: false, 
        reason: `Invalid content-type: ${contentType}` 
      }
    }
  }
  
  // 4. CSRF 토큰 검증 (옵션)
  if (requireToken) {
    const csrfToken = request.headers.get('x-csrf-token') || 
                     request.cookies.get('csrf-token')?.value
    
    if (!csrfToken) {
      return { 
        valid: false, 
        reason: 'Missing CSRF token' 
      }
    }
    
    // 세션의 CSRF 토큰과 비교 (실제 구현에서는 세션에서 가져와야 함)
    // 여기서는 예시로 쿠키에서 가져옴
    const sessionToken = request.cookies.get('csrf-session-token')?.value
    
    if (!validateCSRFToken(csrfToken, sessionToken)) {
      return { 
        valid: false, 
        reason: 'Invalid CSRF token' 
      }
    }
  }
  
  return { valid: true }
}

// CSRF 에러 로깅
export function logCSRFViolation(
  request: NextRequest,
  reason: string
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    method: request.method,
    path: request.nextUrl.pathname,
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    reason
  }
  
  console.error('[CSRF Protection] Violation detected:', logData)
  
  // 프로덕션에서는 보안 모니터링 시스템에 전송
  if (process.env.NODE_ENV === 'production') {
    // TODO: 보안 이벤트 로깅 시스템에 전송
    // sendSecurityEvent('csrf_violation', logData)
  }
}

// 안전한 메소드 확인
export function isSafeMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
}

// API 엔드포인트 확인
export function isAPIEndpoint(pathname: string): boolean {
  return pathname.startsWith('/api/')
}