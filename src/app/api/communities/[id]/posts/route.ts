import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 커뮤니티 게시글 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    
    // 커뮤니티 멤버 확인
    if (user) {
      const { data: member } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', id)
        .eq('user_id', user.id)
        .single()
      
      if (!member) {
        return NextResponse.json(
          { error: '커뮤니티 멤버만 게시글을 볼 수 있습니다' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 게시글 목록 조회
    const { data: posts, error, count } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(
          id,
          username,
          avatar_url
        ),
        _count:community_post_comments(count)
      `, { count: 'exact' })
      .eq('community_id', id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching community posts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      posts: posts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in community posts:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// POST: 커뮤니티 게시글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 커뮤니티 멤버 확인
    const { data: member } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', id)
      .eq('user_id', user.id)
      .single()
    
    if (!member) {
      return NextResponse.json(
        { error: '커뮤니티 멤버만 게시글을 작성할 수 있습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: '제목과 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    // 게시글 생성
    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        community_id: id,
        author_id: user.id,
        title,
        content
      })
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(
          id,
          username,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating community post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Error in create community post:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}