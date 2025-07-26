import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, requireAuth, validateUUID } from '@/lib/security'

/**
 * POST /api/posts/[id]/bookmark
 * 게시글 북마크 토글
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 인증 확인
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

    const { id: postId } = params

    // UUID 유효성 검사
    if (!validateUUID(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', postId)
      .single()

    if (postError || !post || post.status !== 'published') {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // 기존 북마크 확인
    const { data: existingBookmark } = await supabase
      .from('post_bookmarks')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', session.user.id)
      .single()

    if (existingBookmark) {
      // 북마크 제거
      const { error: deleteError } = await supabase
        .from('post_bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', session.user.id)

      if (deleteError) {
        console.error('Delete bookmark error:', deleteError)
        return NextResponse.json(
          { error: 'Failed to remove bookmark' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        bookmarked: false,
        message: 'Bookmark removed successfully',
      })
    } else {
      // 북마크 추가
      const { data: newBookmark, error: insertError } = await supabase
        .from('post_bookmarks')
        .insert({
          post_id: postId,
          user_id: session.user.id,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert bookmark error:', insertError)
        return NextResponse.json(
          { error: 'Failed to add bookmark' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        bookmarked: true,
        bookmark: newBookmark,
        message: 'Bookmark added successfully',
      })
    }
  } catch (error) {
    console.error('Bookmark toggle exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/posts/[id]/bookmark
 * 게시글 북마크 상태 확인
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 인증 확인
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

    const { id: postId } = params

    // UUID 유효성 검사
    if (!validateUUID(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 북마크 상태 확인
    const { data: bookmark, error } = await supabase
      .from('post_bookmarks')
      .select('post_id, created_at')
      .eq('post_id', postId)
      .eq('user_id', session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Get bookmark status error:', error)
      return NextResponse.json(
        { error: 'Failed to check bookmark status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      bookmarked: !!bookmark,
      bookmark: bookmark || null,
    })
  } catch (error) {
    console.error('Get bookmark status exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}