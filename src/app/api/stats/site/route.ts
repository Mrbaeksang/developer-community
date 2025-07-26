/**
 * 사이트 전체 통계 API
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts 테이블 없음!
 * - ✅ posts 테이블만 사용 (모든 게시글)
 * - 📌 이 파일의 코드는 잘못된 테이블명 사용!
 *   - 39라인: free_posts → posts (조건: board_type_id='00f8f32b-faca-4947-94f5-812a0bb97c39')
 *   - 73라인: free_posts → posts (조건: board_type_id='00f8f32b-faca-4947-94f5-812a0bb97c39')
 * 
 * ⚠️ 주의: posts 테이블에서 board_type_id로 필터링해야 함
 * 지식공유: board_type_id = 'cd49ac2e-5fc1-4b08-850a-61f95d29a885'
 * 자유게시판: board_type_id = '00f8f32b-faca-4947-94f5-812a0bb97c39'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

/**
 * GET /api/stats/site
 * 사이트 전체 통계 조회
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()

    // 총 사용자 수
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    // 활성 사용자 수 (최근 30일 이내 로그인)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('last_sign_in_at', thirtyDaysAgo.toISOString())

    // 총 게시글 수 (지식공유)
    const { count: totalKnowledgePosts } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    // 총 게시글 수 (자유게시판)
    const { count: totalFreePosts } = await supabase
      .from('free_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    const totalPosts = (totalKnowledgePosts || 0) + (totalFreePosts || 0)

    // 총 댓글 수
    const { count: totalComments } = await supabase
      .from('post_comments')
      .select('id', { count: 'exact', head: true })

    // 총 좋아요 수
    const { count: totalLikes } = await supabase
      .from('post_likes')
      .select('post_id', { count: 'exact', head: true })

    // 총 커뮤니티 수
    const { count: totalCommunities } = await supabase
      .from('communities')
      .select('id', { count: 'exact', head: true })
      .neq('visibility', 'private')

    // 오늘의 통계
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    // 오늘 새 게시글 수
    const { count: todayPosts } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', todayStart.toISOString())

    const { count: todayFreePosts } = await supabase
      .from('free_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('created_at', todayStart.toISOString())

    const todayNewPosts = (todayPosts || 0) + (todayFreePosts || 0)

    // 오늘 새 댓글 수
    const { count: todayComments } = await supabase
      .from('post_comments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())

    // 오늘 새 사용자 수
    const { count: todayUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())

    // 인기 카테고리 (상위 5개)
    const { data: popularCategories } = await supabase
      .from('posts')
      .select('category_id, categories!inner(id, name, slug)')
      .eq('status', 'published')
      .limit(100)

    const categoryCounts: Record<string, { name: string; count: number }> = {}
    popularCategories?.forEach(post => {
      const categoryId = post.category_id
      const category = post.categories as { id: string; name: string; slug: string } | null; // Type assertion for nested select
      const categoryName = category?.name
      if (categoryId && categoryName) {
        if (!categoryCounts[categoryId]) {
          categoryCounts[categoryId] = { name: categoryName, count: 0 }
        }
        categoryCounts[categoryId].count++
      }
    })

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([id, data]) => ({
        id,
        name: data.name,
        count: data.count
      }))

    return NextResponse.json({
      site_stats: {
        total_users: totalUsers || 0,
        active_users: activeUsers || 0,
        total_posts: totalPosts,
        total_comments: totalComments || 0,
        total_likes: totalLikes || 0,
        total_communities: totalCommunities || 0,
      },
      today_stats: {
        new_posts: todayNewPosts,
        new_comments: todayComments || 0,
        new_users: todayUsers || 0,
      },
      popular_categories: topCategories,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get site stats exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}