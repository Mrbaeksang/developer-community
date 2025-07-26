import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week' // day, week, month, all
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const page = parseInt(searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // 기간별 날짜 계산
    let dateFilter: Date | null = null
    const now = new Date()
    
    switch (period) {
      case 'day':
        dateFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'all':
      default:
        dateFilter = null
    }

    // 트렌딩 점수 계산: view_count * 0.3 + like_count * 0.5 + comment_count * 0.2
    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        excerpt,
        content,
        featured_image,
        author_id,
        board_type_id,
        category_id,
        status,
        view_count,
        like_count,
        comment_count,
        tags,
        created_at,
        published_at,
        profiles!inner (
          id,
          username,
          display_name,
          avatar_url
        ),
        categories!inner (
          id,
          name,
          slug,
          color,
          icon
        ),
        board_types!inner (
          id,
          name,
          slug,
          icon
        )
      `)
      .eq('status', 'published')

    // 기간 필터 적용
    if (dateFilter) {
      query = query.gte('published_at', dateFilter.toISOString())
    }

    // 트렌딩 점수로 정렬 (복합 정렬)
    const { data: posts, error } = await query
      .order('like_count', { ascending: false })
      .order('comment_count', { ascending: false })
      .order('view_count', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('트렌딩 게시글 조회 에러:', error)
      return NextResponse.json(
        { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 총 게시글 수 조회
    let countQuery = supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    if (dateFilter) {
      countQuery = countQuery.gte('published_at', dateFilter.toISOString())
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('게시글 개수 조회 에러:', countError)
    }

    // 데이터 포맷팅
    const formattedPosts = posts?.map(post => {
      const profile = post.profiles as unknown as {
        id: string
        username: string | null
        display_name: string | null
        avatar_url: string | null
      }
      const category = post.categories as unknown as {
        id: string
        name: string
        slug: string
        color: string | null
        icon: string | null
      }
      const boardType = post.board_types as unknown as {
        id: string
        name: string
        slug: string
        icon: string | null
      }

      // 트렌딩 점수 계산
      const trendingScore = 
        (post.view_count || 0) * 0.3 + 
        (post.like_count || 0) * 0.5 + 
        (post.comment_count || 0) * 0.2

      return {
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        featured_image: post.featured_image,
        author_id: post.author_id,
        board_type_id: post.board_type_id,
        category_id: post.category_id,
        status: post.status,
        view_count: post.view_count,
        like_count: post.like_count,
        comment_count: post.comment_count,
        tags: post.tags,
        created_at: post.created_at,
        published_at: post.published_at,
        trending_score: trendingScore,
        author: {
          id: profile.id,
          username: profile.username || 'Unknown',
          display_name: profile.display_name,
          avatar_url: profile.avatar_url
        },
        category,
        board_type: boardType
      }
    }) || []

    // 트렌딩 점수로 재정렬
    formattedPosts.sort((a, b) => b.trending_score - a.trending_score)

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      period
    })
  } catch (error) {
    console.error('트렌딩 게시글 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}