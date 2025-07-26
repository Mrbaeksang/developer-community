import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

/**
 * POST /api/communities/[id]/join
 * 커뮤니티 참여
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
      .select('id, name, visibility')
      .eq('id', communityId)
      .single()

    if (communityError || !community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // 이미 멤버인지 확인
    const { data: existingMember } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'Already a member of this community' },
        { status: 409 }
      )
    }

    // 비공개 커뮤니티의 경우 초대나 승인이 필요할 수 있음
    // 현재는 모든 커뮤니티에 즉시 가입 가능하도록 구현
    const { data: newMember, error: joinError } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: userId,
        role: 'member'
      })
      .select()
      .single()

    if (joinError) {
      console.error('Join community error:', joinError)
      return NextResponse.json(
        { error: 'Failed to join community' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully joined community',
      member: newMember
    })
  } catch (error) {
    console.error('Join community exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}