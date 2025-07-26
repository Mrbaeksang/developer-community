/**
 * 자유게시판 게시글 좋아요 상태 API
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts, free_post_likes 테이블 없음!
 * - ✅ posts, post_likes 테이블 사용
 * - 📌 이 파일의 코드는 잘못된 테이블명 사용!
 *   - free_posts → posts
 *   - free_post_likes → post_likes
 * 
 * ⚠️ 주의: 전체 파일이 잘못된 테이블 구조 사용 중!
 * 실제로는 posts 테이블에서 board_type_id로 필터링해야 함
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

/**
 * GET /api/free-posts/[id]/like/status
 * 현재 사용자의 자유게시판 게시글 좋아요 상태 확인
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
      // 비로그인 사용자도 상태 확인 가능 (항상 false)
      return NextResponse.json({
        post_id: params.id,
        is_liked: false,
        total_likes: 0
      })
    }

    const postId = params.id
    const userId = session.user.id

    // 게시글 좋아요 수 조회
    const { data: post, error: postError } = await supabase
      .from('free_posts')
      .select('id, like_count')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // 현재 사용자의 좋아요 여부 확인
    const { data: like } = await supabase
      .from('free_post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    return NextResponse.json({
      post_id: postId,
      is_liked: !!like,
      total_likes: post.like_count || 0
    })
  } catch (error) {
    console.error('Get like status exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}