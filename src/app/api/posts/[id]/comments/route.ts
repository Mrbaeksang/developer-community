import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => 
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    )

    // 게시글 존재 및 상태 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', id)
      .single()

    if (postError) {
      if (postError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('게시글 조회 에러:', postError)
      return NextResponse.json(
        { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 승인된 게시글의 댓글만 조회 가능
    if (post.status !== 'approved') {
      return NextResponse.json(
        { error: '승인된 게시글의 댓글만 조회할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 댓글 조회
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        author_id,
        profiles!post_comments_author_id_fkey (
          id,
          username,
          display_name
        )
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('댓글 조회 에러:', error)
      return NextResponse.json(
        { error: '댓글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 총 댓글 수 조회
    const { count, error: countError } = await supabase
      .from('post_comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', id)

    if (countError) {
      console.error('댓글 개수 조회 에러:', countError)
    }

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('댓글 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => 
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    )

    // 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 게시글 존재 및 상태 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', id)
      .single()

    if (postError) {
      if (postError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('게시글 조회 에러:', postError)
      return NextResponse.json(
        { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 승인된 게시글만 댓글 작성 가능
    if (post.status !== 'approved') {
      return NextResponse.json(
        { error: '승인된 게시글만 댓글을 작성할 수 있습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content } = body

    // 필수 필드 검증
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 댓글 생성
    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: id,
        author_id: session.user.id,
        content: content.trim()
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        author_id,
        profiles!post_comments_author_id_fkey (
          id,
          username,
          display_name
        )
      `)
      .single()

    if (error) {
      console.error('댓글 생성 에러:', error)
      return NextResponse.json(
        { error: '댓글 작성 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('댓글 작성 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}