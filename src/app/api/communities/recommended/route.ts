import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

/**
 * GET /api/communities/recommended
 * 추천 커뮤니티 목록 조회
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()
    
    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // 세션 확인 (로그인 사용자를 위한 개인화 추천)
    const { data: { session } } = await supabase.auth.getSession()

    // 추천 커뮤니티 조회 기준:
    // 1. 공개 커뮤니티
    // 2. 멤버 수가 많은 순
    // 3. 최근 활동이 활발한 순
    // 4. 사용자가 참여하지 않은 커뮤니티 (로그인한 경우)

    let query = supabase
      .from('communities')
      .select('*')
      .eq('visibility', 'public')

    // 로그인한 사용자의 경우, 이미 참여한 커뮤니티 제외
    if (session?.user?.id) {
      // 사용자가 참여한 커뮤니티 ID 목록 조회
      const { data: userCommunities } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', session.user.id)

      const joinedCommunityIds = userCommunities?.map(c => c.community_id) || []
      
      if (joinedCommunityIds.length > 0) {
        query = query.not('id', 'in', `(${joinedCommunityIds.join(',')})`)
      }
    }

    const { data: communities, error } = await query

    if (error) {
      console.error('Get recommended communities error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recommended communities' },
        { status: 500 }
      )
    }

    // 추천 점수 계산 및 정렬
    const scoredCommunities = await Promise.all(
      (communities || []).map(async (community) => {
        // 멤버 수 조회
        const { count: memberCount } = await supabase
          .from('community_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('community_id', community.id)

        // 최근 7일간 메시지 수 조회
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { count: recentMessageCount } = await supabase
          .from('community_messages')
          .select('id', { count: 'exact', head: true })
          .eq('community_id', community.id)
          .gte('created_at', sevenDaysAgo.toISOString())

        // 추천 점수 계산
        // 멤버 수 가중치: 0.6
        // 최근 활동 가중치: 0.4
        const memberScore = Math.min((memberCount || 0) / 10, 10) * 0.6
        const activityScore = Math.min((recentMessageCount || 0) / 50, 10) * 0.4
        const totalScore = memberScore + activityScore

        return {
          ...community,
          member_count: memberCount || 0,
          recent_activity_count: recentMessageCount || 0,
          recommendation_score: totalScore
        }
      })
    )

    // 추천 점수 기준으로 정렬
    const sortedCommunities = scoredCommunities
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, limit)

    return NextResponse.json({
      communities: sortedCommunities,
      total: sortedCommunities.length
    })
  } catch (error) {
    console.error('Get recommended communities exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}