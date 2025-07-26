import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, requireAuth } from '@/lib/security'
import type { BookmarkFilters } from '@/types/bookmark'

/**
 * GET /api/posts/bookmarks
 * 사용자의 북마크 목록 조회
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 인증 확인
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

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

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const boardType = searchParams.get('board_type')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'
    const offset = (page - 1) * limit

    // 북마크 조회 쿼리 생성
    let query = supabase
      .from('post_bookmarks')
      .select(`
        post_id,
        created_at,
        posts!inner (
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
          author_id,
          author_username,
          author_display_name,
          author_avatar_url,
          board_type_id,
          category_id,
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
        )
      `)
      .eq('user_id', session.user.id)
      .eq('posts.status', 'published')

    // 필터 적용
    if (boardType) {
      query = query.eq('posts.board_type_id', boardType)
    }
    if (category) {
      query = query.eq('posts.category_id', category)
    }

    // 정렬 및 페이지네이션
    query = query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: bookmarks, error } = await query

    if (error) {
      console.error('Get bookmarks error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bookmarks' },
        { status: 500 }
      )
    }

    // 총 북마크 수 조회
    let countQuery = supabase
      .from('post_bookmarks')
      .select('posts!inner(status)', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('posts.status', 'published')

    if (boardType) {
      countQuery = countQuery.eq('posts.board_type_id', boardType)
    }
    if (category) {
      countQuery = countQuery.eq('posts.category_id', category)
    }

    const { count } = await countQuery

    // 응답 데이터 형식 변환
    const transformedBookmarks = bookmarks?.map((bookmark: {
      post_id: string;
      created_at: string;
      posts: {
        id: string;
        title: string;
        excerpt: string | null;
        content: string;
        featured_image: string | null;
        tags: string[] | null;
        status: string;
        like_count: number;
        comment_count: number;
        view_count: number;
        created_at: string;
        published_at: string | null;
        author_id: string;
        author_username: string | null;
        author_display_name: string | null;
        author_avatar_url: string | null;
        board_type_id: string;
        category_id: string;
        board_types: {
          id: string;
          name: string;
          slug: string;
        } | null;
        categories: {
          id: string;
          name: string;
          slug: string;
          color: string | null;
        } | null;
      };
    }) => {
      const post = bookmark.posts; // posts is already an object due to !inner join
      return {
        post_id: bookmark.post_id,
        created_at: bookmark.created_at,
        post: {
          ...post,
          author: {
            id: post.author_id,
            username: post.author_username,
            display_name: post.author_display_name,
            avatar_url: post.author_avatar_url,
          },
          board_type: post.board_types,
          category: post.categories,
        },
      };
    }) || []

    return NextResponse.json({
      bookmarks: transformedBookmarks,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      has_more: offset + limit < (count || 0),
    })
  } catch (error) {
    console.error('Get bookmarks exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}