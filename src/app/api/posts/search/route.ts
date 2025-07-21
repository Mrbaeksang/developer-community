import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        error: '검색어는 최소 2글자 이상 입력해주세요' 
      }, { status: 400 })
    }

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
        categories!inner (
          id,
          name,
          slug,
          color
        ),
        profiles!inner (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    // 제목과 내용에서 검색
    postsQuery = postsQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)

    // 카테고리 필터
    if (category && category !== 'all') {
      postsQuery = postsQuery.eq('categories.slug', category)
    }

    // 페이지네이션
    postsQuery = postsQuery.range(offset, offset + limit - 1)

    const { data: posts, error, count } = await postsQuery

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
        categories!inner (
          id,
          name,
          slug,
          color
        ),
        profiles!inner (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('status', 'published')
      .contains('tags', [query])
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
      category: (() => {
        const category = post.categories as { id: string; name: string; slug: string; color: string }
        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          color: category.color
        }
      })(),
      author: (() => {
        const profile = post.profiles as { id: string; username: string; display_name?: string; avatar_url?: string }
        return {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url
        }
      })()
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
        category: (() => {
          const category = post.categories as { id: string; name: string; slug: string; color: string }
          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            color: category.color
          }
        })(),
        author: (() => {
          const profile = post.profiles as { id: string; username: string; display_name?: string; avatar_url?: string }
          return {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url
          }
        })()
      }))

    const allPosts = [...transformedPosts, ...transformedTagPosts]

    // 전체 개수 조회
    const { count: totalCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)

    return NextResponse.json({
      data: allPosts,
      total: totalCount || 0,
      hasMore: offset + limit < (totalCount || 0),
      query,
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