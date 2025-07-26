import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, sanitizeInput } from '@/lib/security'

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        error: '검색어는 최소 2글자 이상 입력해주세요' 
      }, { status: 400 })
    }

    // Sanitize search query
    const sanitizedQuery = sanitizeInput(query)
    const searchPattern = `%${sanitizedQuery.replace(/[%_]/g, '\\$&')}%`

    // 게시글 검색 쿼리 구성
    let postsQuery = supabase
      .from('posts')
      .select(`
        id,
        title,
        excerpt,
        content,
        view_count,
        like_count,
        comment_count,
        created_at,
        updated_at,
        tags,
        author_id,
        author_username,
        author_display_name,
        author_avatar_url,
        board_type_id,
        board_types (
          id,
          name,
          slug,
          icon,
          requires_approval
        ),
        categories!inner (
          id,
          name,
          slug,
          color,
          board_type_id
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    // 제목과 내용에서 검색 (sanitized)
    postsQuery = postsQuery.or(`title.ilike.${searchPattern},content.ilike.${searchPattern},excerpt.ilike.${searchPattern}`)

    // 카테고리 필터
    if (category && category !== 'all') {
      postsQuery = postsQuery.eq('categories.slug', category)
    }

    // 페이지네이션
    postsQuery = postsQuery.range(offset, offset + limit - 1)

    const { data: posts, error } = await postsQuery

    if (error) {
      console.error('Posts search error:', error)
      return NextResponse.json({ 
        error: '검색 중 오류가 발생했습니다' 
      }, { status: 500 })
    }

    // 태그에서도 검색
    const { data: tagPosts } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        excerpt,
        content,
        view_count,
        like_count,
        comment_count,
        created_at,
        updated_at,
        tags,
        author_id,
        author_username,
        author_display_name,
        author_avatar_url,
        board_type_id,
        board_types (
          id,
          name,
          slug,
          icon,
          requires_approval
        ),
        categories!inner (
          id,
          name,
          slug,
          color,
          board_type_id
        )
      `)
      .eq('status', 'published')
      .contains('tags', [sanitizedQuery])
      .range(0, 10) // 태그 검색은 제한적으로

    // 게시글 데이터 변환
    const transformedPosts = (posts || []).map((post: Record<string, unknown>) => ({
      id: post.id as string,
      title: post.title as string,
      excerpt: post.excerpt as string,
      content: post.content as string,
      view_count: post.view_count as number,
      like_count: (post.like_count as number) || 0,
      comment_count: (post.comment_count as number) || 0,
      created_at: post.created_at as string,
      updated_at: post.updated_at as string,
      tags: (post.tags as string[]) || [],
      board_type_id: post.board_type_id as string,
      board_type: post.board_types ? {
        id: (post.board_types as Record<string, unknown>).id as string,
        name: (post.board_types as Record<string, unknown>).name as string,
        slug: (post.board_types as Record<string, unknown>).slug as string,
        icon: (post.board_types as Record<string, unknown>).icon as string | null,
        requires_approval: (post.board_types as Record<string, unknown>).requires_approval as boolean
      } : undefined,
      category: (() => {
        const category = post.categories as { id: string; name: string; slug: string; color: string; board_type_id: string }
        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          color: category.color,
          board_type_id: category.board_type_id
        }
      })(),
      author: {
        id: post.author_id as string,
        username: post.author_username as string || 'Unknown',
        display_name: post.author_display_name as string | null,
        avatar_url: post.author_avatar_url as string | null
      }
    }))

    // 태그로 찾은 게시글도 추가 (중복 제거)
    const transformedTagPosts = (tagPosts || [])
      .filter((tagPost: Record<string, unknown>) => !transformedPosts.some(post => post.id === tagPost.id))
      .map((post: Record<string, unknown>) => ({
        id: post.id as string,
        title: post.title as string,
        excerpt: post.excerpt as string,
        content: post.content as string,
        view_count: post.view_count as number,
        like_count: (post.like_count as number) || 0,
        comment_count: (post.comment_count as number) || 0,
        created_at: post.created_at as string,
        updated_at: post.updated_at as string,
        tags: (post.tags as string[]) || [],
        board_type_id: post.board_type_id as string,
        board_type: post.board_types ? {
          id: (post.board_types as Record<string, unknown>).id as string,
          name: (post.board_types as Record<string, unknown>).name as string,
          slug: (post.board_types as Record<string, unknown>).slug as string,
          icon: (post.board_types as Record<string, unknown>).icon as string | null,
          requires_approval: (post.board_types as Record<string, unknown>).requires_approval as boolean
        } : undefined,
        category: (() => {
          const category = post.categories as { id: string; name: string; slug: string; color: string; board_type_id: string }
          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            color: category.color,
            board_type_id: category.board_type_id
          }
        })(),
        author: {
          id: post.author_id as string,
          username: post.author_username as string || 'Unknown',
          display_name: post.author_display_name as string | null,
          avatar_url: post.author_avatar_url as string | null
        }
      }))

    const allPosts = [...transformedPosts, ...transformedTagPosts]

    // 전체 개수 조회
    const { count: totalCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .or(`title.ilike.${searchPattern},content.ilike.${searchPattern},excerpt.ilike.${searchPattern}`)

    return NextResponse.json({
      data: allPosts,
      total: totalCount || 0,
      hasMore: offset + limit < (totalCount || 0),
      query: sanitizedQuery,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil((totalCount || 0) / limit)
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다' 
    }, { status: 500 })
  }
}