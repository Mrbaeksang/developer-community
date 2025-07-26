import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

/**
 * POST /api/communities/[id]/leave
 * 커뮤니티 탈퇴
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()
    
    // 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const communityId = params.id
    const userId = session.user.id

    // 커뮤니티 존재 여부 확인
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name, creator_id')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // 커뮤니티 생성자는 탈퇴할 수 없음
    if (community.creator_id === userId) {
      return NextResponse.json(
        { error: 'Community creator cannot leave the community' },
        { status: 403 }
      )
    }

    // 멤버십 확인
    const { data: membership, error: membershipError } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 404 }
      )
    }

    // 멤버십 삭제
    const { error: deleteError } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Leave community error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to leave community' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully left community'
    })
  } catch (error) {
    console.error('Leave community exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}