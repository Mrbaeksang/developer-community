import { NextResponse } from 'next/server';

// 표준 API 응답 인터페이스
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
  timestamp: string;
}

// 에러 코드 상수
export const ErrorCodes = {
  // 인증 관련
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // 검증 관련
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // 리소스 관련
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // 서버 관련
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // 제한 관련
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // 비즈니스 로직
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_STATE: 'INVALID_STATE',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED'
} as const;

// API 응답 빌더 클래스
export class ApiResponseBuilder {
  // 성공 응답
  static success<T>(
    data: T,
    meta?: ApiResponse['meta']
  ): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
    
    if (meta) {
      response.meta = meta;
    }
    
    return NextResponse.json(response, { status: 200 });
  }
  
  // 생성 성공 응답
  static created<T>(data: T): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }, { status: 201 });
  }
  
  // 삭제 성공 응답
  static deleted(message = '리소스가 삭제되었습니다'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: true,
      data: { message },
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }
  
  // 에러 응답
  static error(
    code: keyof typeof ErrorCodes | string,
    message: string,
    status: number,
    details?: unknown
  ): NextResponse<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details })
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response, { status });
  }
  
  // 일반적인 에러 응답들
  static unauthorized(message = '인증이 필요합니다'): NextResponse<ApiResponse> {
    return this.error(ErrorCodes.UNAUTHORIZED, message, 401);
  }
  
  static forbidden(message = '권한이 없습니다'): NextResponse<ApiResponse> {
    return this.error(ErrorCodes.FORBIDDEN, message, 403);
  }
  
  static notFound(message = '리소스를 찾을 수 없습니다'): NextResponse<ApiResponse> {
    return this.error(ErrorCodes.NOT_FOUND, message, 404);
  }
  
  static validationError(
    message: string,
    details?: unknown
  ): NextResponse<ApiResponse> {
    return this.error(ErrorCodes.VALIDATION_ERROR, message, 400, details);
  }
  
  static conflict(message: string): NextResponse<ApiResponse> {
    return this.error(ErrorCodes.CONFLICT, message, 409);
  }
  
  static rateLimitExceeded(
    retryAfter: number
  ): NextResponse<ApiResponse> {
    const response = this.error(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      429
    );
    
    response.headers.set('Retry-After', String(retryAfter));
    return response;
  }
  
  static internalError(
    message = '서버 오류가 발생했습니다',
    details?: unknown
  ): NextResponse<ApiResponse> {
    // 프로덕션에서는 상세 정보 숨김
    const isProduction = process.env.NODE_ENV === 'production';
    return this.error(
      ErrorCodes.INTERNAL_ERROR,
      message,
      500,
      isProduction ? undefined : details
    );
  }
}

// 에러 핸들링 헬퍼
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);
  
  // Type guard for error with code property
  const errorWithCode = error as { code?: string };
  
  // Supabase 에러 처리
  if (errorWithCode?.code === 'PGRST116') {
    return ApiResponseBuilder.notFound();
  }
  
  if (errorWithCode?.code === '23505') {
    return ApiResponseBuilder.conflict('이미 존재하는 데이터입니다');
  }
  
  if (errorWithCode?.code === '23503') {
    return ApiResponseBuilder.validationError('참조하는 데이터가 존재하지 않습니다');
  }
  
  // 기본 에러
  return ApiResponseBuilder.internalError();
}