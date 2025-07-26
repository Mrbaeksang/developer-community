import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/security'
import { 
  executeWithRLSHandling,
  handleRLSError 
} from '@/lib/supabase/rls-error-handler'

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => 
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    )

    // 병렬로 모든 통계 조회 - RLS 에러 처리 포함
    const [
      usersResult,
      postsResult,
      communitiesResult
    ] = await Promise.all([
      // 전체 회원 수
      executeWithRLSHandling(
        () => supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
        {
          context: '전체 회원 수 조회',
          fallbackData: { count: 0 }
        }
      ),
      
      // 승인된 게시글 수
      executeWithRLSHandling(
        () => supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published'),
        {
          context: '게시된 게시글 수 조회',
          fallbackData: { count: 0 }
        }
      ),
      
      // 전체 커뮤니티 수
      executeWithRLSHandling(
        () => supabase
          .from('communities')
          .select('id', { count: 'exact', head: true }),
        {
          context: '전체 커뮤니티 수 조회',
          fallbackData: { count: 0 }
        }
      )
    ])

    // 에러 체크 (RLS 에러가 아닌 경우만 로그)
    if (usersResult.error && !usersResult.isRLSError) {
      console.error('회원 수 조회 에러:', usersResult.error)
    }
    if (postsResult.error && !postsResult.isRLSError) {
      console.error('게시글 수 조회 에러:', postsResult.error)
    }
    if (communitiesResult.error && !communitiesResult.isRLSError) {
      console.error('커뮤니티 수 조회 에러:', communitiesResult.error)
    }

    const stats = {
      totalUsers: usersResult.data?.count || 0,
      totalPosts: postsResult.data?.count || 0,
      totalCommunities: communitiesResult.data?.count || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('통계 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}