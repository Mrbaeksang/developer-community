import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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

    // 병렬로 모든 통계 조회
    const [
      usersResult,
      postsResult,
      communitiesResult
    ] = await Promise.all([
      // 전체 회원 수
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
      
      // 승인된 게시글 수
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved'),
      
      // 전체 커뮤니티 수
      supabase
        .from('communities')
        .select('id', { count: 'exact', head: true })
    ])

    // 에러 체크
    if (usersResult.error) {
      console.error('회원 수 조회 에러:', usersResult.error)
    }
    if (postsResult.error) {
      console.error('게시글 수 조회 에러:', postsResult.error)
    }
    if (communitiesResult.error) {
      console.error('커뮤니티 수 조회 에러:', communitiesResult.error)
    }

    const stats = {
      totalUsers: usersResult.count || 0,
      totalPosts: postsResult.count || 0,
      totalCommunities: communitiesResult.count || 0
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