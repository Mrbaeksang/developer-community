import { NextRequest } from 'next/server';
import crypto from 'crypto';

// CSRF 토큰 관리 시스템
interface CsrfToken {
  token: string;
  createdAt: number;
  ip: string;
}

// 메모리 기반 토큰 저장소 (프로덕션에서는 Redis 사용 권장)
const tokenStore = new Map<string, CsrfToken>();
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1시간

export class CsrfProtection {
  // 토큰 생성
  static generateToken(request: NextRequest): string {
    const token = crypto.randomBytes(32).toString('hex');
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    tokenStore.set(token, {
      token,
      createdAt: Date.now(),
      ip
    });
    
    // 만료된 토큰 정리
    this.cleanupExpiredTokens();
    
    return token;
  }
  
  // 토큰 검증
  static verifyToken(token: string, request: NextRequest): boolean {
    if (!token) return false;
    
    const storedToken = tokenStore.get(token);
    if (!storedToken) return false;
    
    // IP 검증
    const currentIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    if (storedToken.ip !== currentIp) return false;
    
    // 만료 시간 검증
    if (Date.now() - storedToken.createdAt > TOKEN_EXPIRY) {
      tokenStore.delete(token);
      return false;
    }
    
    // 일회용 토큰 - 사용 후 삭제
    tokenStore.delete(token);
    return true;
  }
  
  // 만료된 토큰 정리
  private static cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, data] of tokenStore.entries()) {
      if (now - data.createdAt > TOKEN_EXPIRY) {
        tokenStore.delete(token);
      }
    }
  }
  
  // 토큰을 쿠키에서 추출
  static extractTokenFromRequest(request: NextRequest): string | null {
    const csrfHeader = request.headers.get('x-csrf-token');
    if (csrfHeader) return csrfHeader;
    
    // FormData에서 추출 (multipart/form-data)
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('multipart/form-data')) {
      // FormData 파싱은 별도 처리 필요
      return null;
    }
    
    return null;
  }
}

// CSRF 미들웨어 헬퍼
export async function requireCsrfToken(request: NextRequest): Promise<boolean> {
  // GET, HEAD, OPTIONS는 CSRF 검증 불필요
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }
  
  const token = CsrfProtection.extractTokenFromRequest(request);
  if (!token) return false;
  
  return CsrfProtection.verifyToken(token, request);
}