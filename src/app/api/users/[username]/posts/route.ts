import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

/**
 * GET /api/users/[username]/posts
 * 특정 사용자의 게시글 목록 조회
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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 사용자 ID 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 게시글 조회
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        excerpt,
        content,
        featured_image,
        tags,
        status,
        like_count,
        comment_count,
        view_count,
        created_at,
        published_at,
        board_types (
          id,
          name,
          slug
        ),
        categories (
          id,
          name,
          slug,
          color
        )
      `)
      .eq('author_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Get user posts error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    // 총 게시글 수 조회
    const { count } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', profile.id)
      .eq('status', 'published')

    return NextResponse.json({
      posts: posts || [],
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      totalCount: count || 0,
    })
  } catch (error) {
    console.error('Get user posts exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}