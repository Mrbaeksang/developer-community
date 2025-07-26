import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

/**
 * GET /api/users/[username]
 * 특정 사용자 프로필 조회 (username으로)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const { username } = params

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 사용자 프로필 조회
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        bio,
        created_at
      `)
      .eq('username', username)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 사용자 통계 조회
    const [postsResult, commentsResult, communitiesResult] = await Promise.all([
      // 게시글 수
      supabase
        .from('posts')
        .select('id', { count: 'exact' })
        .eq('author_id', profile.id)
        .eq('status', 'published'),
      
      // 댓글 수
      supabase
        .from('post_comments')
        .select('id', { count: 'exact' })
        .eq('author_id', profile.id)
        .eq('is_deleted', false),
      
      // 참여 커뮤니티 수
      supabase
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('user_id', profile.id)
    ])

    const stats = {
      posts_count: postsResult.count || 0,
      comments_count: commentsResult.count || 0,
      communities_count: communitiesResult.count || 0,
    }

    return NextResponse.json({
      ...profile,
      stats,
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}