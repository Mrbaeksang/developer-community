/**
 * 관리자 대시보드 통계 API
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts 테이블 없음!
 * - ✅ posts 테이블만 사용 (모든 게시글)
 * - 📌 이 파일의 코드는 잘못된 테이블명 사용!
 *   - 74라인: free_posts → posts (조건: board_type_id='00f8f32b-faca-4947-94f5-812a0bb97c39')
 * 
 * ⚠️ 주의: posts 테이블에서 board_type_id로 필터링해야 함
 * 지식공유: board_type_id = 'cd49ac2e-5fc1-4b08-850a-61f95d29a885'
 * 자유게시판: board_type_id = '00f8f32b-faca-4947-94f5-812a0bb97c39'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, requireAdmin } from '@/lib/security'

/**
 * GET /api/admin/stats
 * 관리자 대시보드 통계
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 관리자 권한 확인 - 개선된 버전
    const adminResult = await requireAdmin(request)
    if (adminResult instanceof NextResponse) return adminResult
    
    // requireAdmin이 성공하면 supabase 클라이언트와 user 정보를 반환
    const { supabase, user } = adminResult
    
    console.log('[Admin Stats API] Authenticated admin:', user.id)

    // 병렬로 데이터 조회
    const [
      // 사용자 통계
      { count: totalUsers },
      { count: activeUsers },
      { count: adminUsers },
      
      // 게시글 통계 (지식공유)
      { count: totalPosts },
      { count: publishedPosts },
      { count: pendingPosts },
      { count: draftPosts },
      { count: rejectedPosts },
      
      // 게시글 통계 (자유게시판)
      { count: totalFreePosts },
      
      // 커뮤니티 통계
      { count: totalCommunities },
      { count: publicCommunities },
      { count: privateCommunities },
      
      // 댓글/좋아요 통계
      { count: totalComments },
      { count: totalLikes },
      
      // 오늘의 활동
      { count: todayNewUsers },
      { count: todayNewPosts },
      { count: todayPendingPosts }
    ] = await Promise.all([
      // 사용자 통계
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .gte('last_sign_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .eq('role', 'admin'),
      
      // 게시글 통계 (지식공유)
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase.from('posts').select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase.from('posts').select('*', { count: 'exact', head: true })
        .eq('status', 'draft'),
      supabase.from('posts').select('*', { count: 'exact', head: true })
        .eq('status', 'rejected'),
      
      // 게시글 통계 (자유게시판)
      supabase.from('free_posts').select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      
      // 커뮤니티 통계
      supabase.from('communities').select('*', { count: 'exact', head: true }),
      supabase.from('communities').select('*', { count: 'exact', head: true })
        .eq('visibility', 'public'),
      supabase.from('communities').select('*', { count: 'exact', head: true })
        .eq('visibility', 'private'),
      
      // 댓글/좋아요 통계
      supabase.from('post_comments').select('*', { count: 'exact', head: true }),
      supabase.from('post_likes').select('*', { count: 'exact', head: true }),
      
      // 오늘의 활동
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('posts').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('posts').select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', new Date().toISOString().split('T')[0])
    ])

    // 최근 활동 (최근 7일)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // 일별 통계 조회
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // 일별 통계 집계
    const dailyStats: Record<string, { posts: number; users: number }> = {}
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      dailyStats[dateKey] = { posts: 0, users: 0 }
    }

    recentPosts?.forEach(post => {
      const dateKey = post.created_at.split('T')[0]
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].posts++
      }
    })

    recentUsers?.forEach(user => {
      const dateKey = user.created_at.split('T')[0]
      if (dailyStats[dateKey]) {
        dailyStats[dateKey].users++
      }
    })

    const chartData = Object.entries(dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        posts: stats.posts,
        users: stats.users
      }))

    return NextResponse.json({
      overview: {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        admin_users: adminUsers || 0,
        total_posts: publishedPosts || 0,
        total_posts_all: totalPosts || 0,
        total_free_posts: totalFreePosts || 0,
        pending_posts: pendingPosts || 0,
        draft_posts: draftPosts || 0,
        rejected_posts: rejectedPosts || 0,
        total_communities: totalCommunities || 0,
        public_communities: publicCommunities || 0,
        private_communities: privateCommunities || 0,
        total_comments: totalComments || 0,
        total_likes: totalLikes || 0,
      },
      today: {
        new_users: todayNewUsers || 0,
        new_posts: todayNewPosts || 0,
        pending_posts: todayPendingPosts || 0,
      },
      chart_data: chartData,
    })
  } catch (error) {
    console.error('Get admin stats exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}