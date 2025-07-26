import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

/**
 * GET /api/communities/search
 * 커뮤니티 검색
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()
    
    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const visibility = searchParams.get('visibility') // public, private, all

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // 커뮤니티 검색
    let searchQuery = supabase
      .from('communities')
      .select(`
        *,
        creator:profiles!communities_creator_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)

    // 공개 상태 필터
    if (visibility === 'public') {
      searchQuery = searchQuery.eq('visibility', 'public')
    } else if (visibility === 'private') {
      searchQuery = searchQuery.eq('visibility', 'private')
    }
    // visibility가 'all'이거나 없으면 모든 커뮤니티 조회

    // 정렬 및 페이지네이션
    searchQuery = searchQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: communities, error } = await searchQuery

    if (error) {
      console.error('Search communities error:', error)
      return NextResponse.json(
        { error: 'Failed to search communities' },
        { status: 500 }
      )
    }

    // 각 커뮤니티의 멤버 수 조회
    const communitiesWithStats = await Promise.all(
      (communities || []).map(async (community) => {
        const { count: memberCount } = await supabase
          .from('community_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('community_id', community.id)

        return {
          ...community,
          member_count: memberCount || 0
        }
      })
    )

    // 전체 검색 결과 수 조회
    let countQuery = supabase
      .from('communities')
      .select('id', { count: 'exact', head: true })
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)

    if (visibility === 'public') {
      countQuery = countQuery.eq('visibility', 'public')
    } else if (visibility === 'private') {
      countQuery = countQuery.eq('visibility', 'private')
    }

    const { count } = await countQuery

    return NextResponse.json({
      communities: communitiesWithStats,
      total: count || 0,
      has_more: offset + limit < (count || 0)
    })
  } catch (error) {
    console.error('Search communities exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}