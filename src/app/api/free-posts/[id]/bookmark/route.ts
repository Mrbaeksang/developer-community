/**
 * 자유게시판 개별 게시글 북마크 API
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_post_bookmarks, free_posts 테이블 없음!
 * - ✅ post_bookmarks, posts 테이블 사용
 * - 📌 이 파일의 코드는 잘못된 테이블명 사용!
 *   - free_post_bookmarks → post_bookmarks
 *   - free_posts → posts
 * 
 * ⚠️ 주의: 전체 파일이 잘못된 테이블 구조 사용 중!
 * 실제로는 posts 테이블에서 board_type_id로 필터링해야 함
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

/**
 * GET /api/free-posts/[id]/bookmark
 * 자유게시판 게시글 북마크 상태 확인
 */
export async function GET(
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
      return NextResponse.json({
        post_id: params.id,
        is_bookmarked: false
      })
    }

    const postId = params.id
    const userId = session.user.id

    // 북마크 여부 확인
    const { data: bookmark } = await supabase
      .from('free_post_bookmarks')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      post_id: postId,
      is_bookmarked: !!bookmark
    })
  } catch (error) {
    console.error('Get bookmark status exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/free-posts/[id]/bookmark
 * 자유게시판 게시글 북마크 추가/제거
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

    const postId = params.id
    const userId = session.user.id

    // 게시글 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('free_posts')
      .select('id, status')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // 공개된 게시글만 북마크 가능
    if (post.status !== 'published') {
      return NextResponse.json(
        { error: 'Only published posts can be bookmarked' },
        { status: 403 }
      )
    }

    // 기존 북마크 확인
    const { data: existingBookmark } = await supabase
      .from('free_post_bookmarks')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (existingBookmark) {
      // 북마크 제거
      const { error: deleteError } = await supabase
        .from('free_post_bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)

      if (deleteError) {
        console.error('Remove bookmark error:', deleteError)
        return NextResponse.json(
          { error: 'Failed to remove bookmark' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Bookmark removed',
        is_bookmarked: false
      })
    } else {
      // 북마크 추가
      const { error: insertError } = await supabase
        .from('free_post_bookmarks')
        .insert({
          post_id: postId,
          user_id: userId
        })

      if (insertError) {
        console.error('Add bookmark error:', insertError)
        return NextResponse.json(
          { error: 'Failed to add bookmark' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Bookmark added',
        is_bookmarked: true
      })
    }
  } catch (error) {
    console.error('Bookmark operation exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}