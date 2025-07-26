/**
 * RLS (Row Level Security) 에러 처리 유틸리티
 * 
 * Supabase RLS 정책으로 인한 권한 에러를 일관되게 처리합니다.
 * 
 * 주요 기능:
 * 1. RLS 권한 에러 감지 (42501, permission 관련)
 * 2. 안전한 폴백 데이터 반환
 * 3. 일관된 에러 로깅
 * 4. 사용자 친화적 에러 메시지
 */

import { NextResponse } from 'next/server'

/**
 * RLS 에러 코드 및 메시지 패턴
 */
export const RLS_ERROR_PATTERNS = {
  codes: ['42501', '42P01', '25P02'],
  messages: [
    'permission denied',
    'permission',
    'insufficient_privilege',
    'policy',
    'row level security',
    'rls'
  ]
} as const

/**
 * RLS 에러 감지 함수
 */
export function isRLSError(error: any): boolean {
  if (!error) return false
  
  // 에러 코드 확인
  if (error.code && RLS_ERROR_PATTERNS.codes.includes(error.code)) {
    return true
  }
  
  // 에러 메시지 확인
  if (error.message && typeof error.message === 'string') {
    const message = error.message.toLowerCase()
    return RLS_ERROR_PATTERNS.messages.some(pattern => 
      message.includes(pattern)
    )
  }
  
  return false
}

/**
 * RLS 에러 로깅
 */
export function logRLSError(context: string, error: any, userId?: string) {
  console.log(`[RLS 정책] ${context} 접근 제한`, {
    errorCode: error?.code,
    errorMessage: error?.message,
    userId,
    timestamp: new Date().toISOString()
  })
}

/**
 * RLS 에러 처리 옵션
 */
export interface RLSErrorHandlerOptions {
  /** 폴백 데이터 (기본값: null) */
  fallbackData?: any
  /** 사용자 ID (로깅용) */
  userId?: string
  /** 컨텍스트 설명 (로깅용) */
  context?: string
  /** 빈 배열 반환 여부 (목록 API용) */
  returnEmptyArray?: boolean
  /** 404 응답 여부 (단일 리소스용) */
  return404?: boolean
  /** 커스텀 에러 메시지 */
  customMessage?: string
}

/**
 * RLS 에러 핸들러 - API 응답 생성
 */
export function handleRLSError(
  error: any,
  options: RLSErrorHandlerOptions = {}
): NextResponse {
  const {
    fallbackData = null,
    userId,
    context = 'API 호출',
    returnEmptyArray = false,
    return404 = false,
    customMessage
  } = options

  // RLS 에러인지 확인
  if (!isRLSError(error)) {
    // RLS 에러가 아닌 경우 일반 에러로 처리
    return NextResponse.json(
      { error: customMessage || '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }

  // RLS 에러 로깅
  logRLSError(context, error, userId)

  // 404 반환 옵션
  if (return404) {
    return NextResponse.json(
      { error: '리소스를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // 빈 배열 반환 (목록 API용)
  if (returnEmptyArray) {
    return NextResponse.json({
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    })
  }

  // 폴백 데이터 반환
  return NextResponse.json(fallbackData)
}

/**
 * 데이터베이스 쿼리 래퍼 - RLS 에러 자동 처리
 */
export async function executeWithRLSHandling<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RLSErrorHandlerOptions = {}
): Promise<{ data: T | null; error: any; isRLSError?: boolean }> {
  try {
    const result = await queryFn()
    
    if (result.error && isRLSError(result.error)) {
      logRLSError(options.context || 'Database query', result.error, options.userId)
      
      return {
        data: options.returnEmptyArray ? [] as any : (options.fallbackData || null),
        error: null,
        isRLSError: true
      }
    }
    
    return result
  } catch (error) {
    if (isRLSError(error)) {
      logRLSError(options.context || 'Database query', error, options.userId)
      
      return {
        data: options.returnEmptyArray ? [] as any : (options.fallbackData || null),
        error: null,
        isRLSError: true
      }
    }
    
    // RLS 에러가 아닌 경우 원본 에러 반환
    return {
      data: null,
      error,
      isRLSError: false
    }
  }
}

/**
 * 관리자 권한 확인 및 RLS 에러 처리
 */
export async function checkAdminPermission(
  supabase: any,
  userId: string
): Promise<{ isAdmin: boolean; error?: NextResponse }> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      if (isRLSError(error)) {
        logRLSError('관리자 권한 확인', error, userId)
        return {
          isAdmin: false,
          error: NextResponse.json(
            { error: '권한이 부족합니다.' },
            { status: 403 }
          )
        }
      }
      
      return {
        isAdmin: false,
        error: NextResponse.json(
          { error: '사용자 정보를 확인할 수 없습니다.' },
          { status: 500 }
        )
      }
    }

    if (!profile || profile.role !== 'admin') {
      return {
        isAdmin: false,
        error: NextResponse.json(
          { error: '관리자 권한이 필요합니다.' },
          { status: 403 }
        )
      }
    }

    return { isAdmin: true }
  } catch (error) {
    return {
      isAdmin: false,
      error: NextResponse.json(
        { error: '권한 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  }
}

/**
 * 사용자 인증 확인 및 RLS 에러 처리
 */
export async function checkUserAuthentication(
  supabase: any
): Promise<{ user: any; error?: NextResponse }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: '인증이 필요합니다.' },
          { status: 401 }
        )
      }
    }
    
    return { user }
  } catch (error) {
    return {
      user: null,
      error: NextResponse.json(
        { error: '인증 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }
  }
}