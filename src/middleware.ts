import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateCSRFProtection, logCSRFViolation, isAPIEndpoint, isSafeMethod } from '@/lib/security/csrf'
import { checkRateLimit, setRateLimitHeaders, getRateLimitConfig } from '@/lib/security/rate-limit'

// Security headers for production
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 레거시 URL 리다이렉션
  const redirects: Record<string, string> = {
    '/posts': '/knowledge',
    '/free-board': '/forum',
  }

  // 동적 경로 리다이렉션 처리
  if (pathname.startsWith('/posts/')) {
    const newPath = pathname.replace('/posts/', '/knowledge/')
    return NextResponse.redirect(new URL(newPath, request.url), 301)
  }
  
  if (pathname.startsWith('/free-board/')) {
    const newPath = pathname.replace('/free-board/', '/forum/')
    return NextResponse.redirect(new URL(newPath, request.url), 301)
  }

  // 정적 경로 리다이렉션
  if (redirects[pathname]) {
    return NextResponse.redirect(new URL(redirects[pathname], request.url), 301)
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Rate Limiting for API endpoints
  if (isAPIEndpoint(pathname)) {
    const rateLimitConfig = getRateLimitConfig(pathname)
    const rateLimitResult = checkRateLimit(request, rateLimitConfig)
    
    // Rate limit 헤더 설정
    setRateLimitHeaders(response.headers, rateLimitResult)
    
    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: rateLimitConfig.message || 'Please try again later',
          retryAfter: rateLimitResult.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  }

  // Enhanced CSRF Protection
  if (isAPIEndpoint(pathname) && !isSafeMethod(request.method)) {
    const csrfValidation = validateCSRFProtection(request, {
      excludePaths: [
        '/api/auth/callback', // Supabase auth callback
        '/api/webhooks' // Webhook endpoints
      ],
      customOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireToken: false // 토큰 기반 보호는 추후 구현
    })
    
    if (!csrfValidation.valid) {
      // CSRF 위반 로깅
      logCSRFViolation(request, csrfValidation.reason || 'Unknown reason')
      
      // 에러 응답
      return new NextResponse(
        JSON.stringify({ 
          error: 'CSRF validation failed',
          message: process.env.NODE_ENV === 'development' ? csrfValidation.reason : undefined
        }),
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Supabase 쿠키 설정 개선
            response.cookies.set(name, value, {
              ...options,
              httpOnly: options?.httpOnly ?? false,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7일
            })
          })
        },
      },
    }
  )

  // 보호된 라우트에만 getUser 사용
  let user = null
  let hasValidSession = false
  
  // 보호된 라우트 정의
  const protectedRoutes = ['/write', '/knowledge/new', '/forum/new', '/communities', '/admin', '/profile']
  const authRoutes = ['/auth/login', '/auth/signup']

  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // 보호된 라우트일 때만 인증 확인
  if (isProtectedRoute || isAuthRoute || pathname.startsWith('/api/admin')) {
    // getSession은 캐시된 세션을 사용하여 더 빠름
    const { data: { session }, error } = await supabase.auth.getSession()
    
    // 디버그 로깅
    console.log('[Middleware] 세션 체크:', {
      path: pathname,
      hasSession: !!session,
      sessionError: error?.message,
      userId: session?.user?.id,
      expiresAt: session?.expires_at,
      cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
    })
    
    if (!error && session?.user) {
      user = session.user
      hasValidSession = true
    }
  }
  

  // 인증되지 않은 사용자가 보호된 라우트에 접근하려고 할 때
  if (isProtectedRoute && !hasValidSession) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 인증된 사용자가 로그인/회원가입 페이지에 접근하려고 할 때
  if (isAuthRoute && hasValidSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 관리자 전용 라우트
  if (request.nextUrl.pathname.startsWith('/admin') && hasValidSession) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id || '')
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}