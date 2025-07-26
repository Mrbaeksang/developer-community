/**
 * 자유게시판 북마크 API
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_post_bookmarks, free_posts 테이블 없음!
 * - ✅ post_bookmarks, posts 테이블 사용
 * - 📌 이 파일의 코드는 잘못된 테이블명 사용!
 *   - free_post_bookmarks → post_bookmarks
 *   - free_posts → posts
 *   - free_post_comments → post_comments
 * 
 * ⚠️ 주의: 전체 파일이 잘못된 테이블 구조 사용 중!
 * 실제로는 posts 테이블에서 board_type_id로 필터링해야 함
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

/**
 * GET /api/free-posts/bookmarks
 * 자유게시판 북마크 목록 조회
 */
export async function GET(request: NextRequest) {
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

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 북마크한 자유게시판 게시글 조회
    const { data: bookmarks, error, count } = await supabase
      .from('free_post_bookmarks')
      .select(`
        free_post:free_posts (
          id,
          title,
          content,
          status,
          created_at,
          user_id,
          category_id,
          like_count,
          author:profiles!inner (
            id,
            username,
            display_name,
            avatar_url
          ),
          category:categories!inner (
            id,
            name,
            slug
          )
        )
      `, { count: 'exact' })
      .eq('user_id', session.user.id)
      .eq('free_post.status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Get bookmarks error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookmarks' },
        { status: 500 }
      )
    }

    // 각 게시글의 댓글 수 조회
    const formattedBookmarks = await Promise.all(
      (bookmarks || []).map(async (bookmark: {
        free_post: {
          id: string;
          title: string;
          content: string;
          status: string;
          created_at: string;
          user_id: string;
          category_id: string;
          like_count: number;
          author: {
            id: string;
            username: string | null;
            display_name: string | null;
            avatar_url: string | null;
          };
          category: {
            id: string;
            name: string;
            slug: string;
          };
        } | null;
      }) => {
        if (!bookmark.free_post) return null

        const post = bookmark.free_post;
        const { count: commentCount } = await supabase
          .from('free_post_comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', post.id)

        return {
          ...post,
          comment_count: commentCount || 0,
          is_bookmarked: true
        }
      })
    )

    // null 값 필터링
    const validBookmarks = formattedBookmarks.filter(b => b !== null)

    return NextResponse.json({
      posts: validBookmarks,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Get bookmarks exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}