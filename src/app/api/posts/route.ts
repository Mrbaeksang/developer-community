import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'approved'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
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

    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        excerpt,
        status,
        created_at,
        updated_at,
        view_count,
        like_count,
        category_id,
        author_id,
        post_categories (
          id,
          name,
          slug
        ),
        profiles!posts_author_id_fkey (
          id,
          username,
          display_name
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('post_categories.slug', category)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('게시글 조회 에러:', error)
      return NextResponse.json(
        { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 총 개수 조회
    let countQuery = supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)

    if (category) {
      countQuery = countQuery.eq('post_categories.slug', category)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('게시글 개수 조회 에러:', countError)
    }

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('게시글 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { title, content, excerpt, category_id } = body

    // 필수 필드 검증
    if (!title || !content || !category_id) {
      return NextResponse.json(
        { error: '제목, 내용, 카테고리는 필수입니다.' },
        { status: 400 }
      )
    }

    // 게시글 생성 (기본 status: pending - 관리자 승인 대기)
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        excerpt: excerpt || content.substring(0, 200),
        category_id,
        author_id: session.user.id,
        status: 'pending'
      })
      .select(`
        id,
        title,
        content,
        excerpt,
        status,
        created_at,
        updated_at,
        view_count,
        like_count,
        category_id,
        author_id
      `)
      .single()

    if (error) {
      console.error('게시글 생성 에러:', error)
      return NextResponse.json(
        { error: '게시글 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('게시글 생성 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}