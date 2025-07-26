/**
 * 사용자별 자유게시판 게시글 API
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts, free_post_comments 테이블 없음!
 * - ✅ posts, post_comments 테이블 사용
 * - 📌 이 파일의 코드는 잘못된 테이블명 사용!
 *   - 43라인: free_posts → posts
 *   - 75라인: free_post_comments → post_comments
 * 
 * ⚠️ 주의: posts 테이블에서 board_type_id로 필터링해야 함
 * 자유게시판: board_type_id = '00f8f32b-faca-4947-94f5-812a0bb97c39'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

/**
 * GET /api/users/[username]/free-posts
 * 특정 사용자의 자유게시판 게시글 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()
    const username = params.username

    // 사용자 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('username', username)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 해당 사용자의 자유게시판 게시글 조회
    const { data: posts, error, count } = await supabase
      .from('free_posts')
      .select(`
        id,
        title,
        content,
        status,
        created_at,
        category_id,
        like_count,
        category:categories (
          id,
          name,
          slug
        )
      `, { count: 'exact' })
      .eq('user_id', profile.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Get user free posts error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user free posts' },
        { status: 500 }
      )
    }

    // 각 게시글의 댓글 수 조회
    const formattedPosts = await Promise.all(
      (posts || []).map(async (post) => {
        const { count: commentCount } = await supabase
          .from('free_post_comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', post.id)

        return {
          ...post,
          author: profile,
          comment_count: commentCount || 0
        }
      })
    )

    return NextResponse.json({
      user: profile,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Get user free posts exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}