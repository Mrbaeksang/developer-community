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

    // 게시글 조회
    const { data: post, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('게시글 조회 에러:', error)
      return NextResponse.json(
        { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 승인된 게시글이거나 작성자 본인인지 확인
    const { data: { session } } = await supabase.auth.getSession()
    
    if (post.status !== 'approved' && (!session || session.user.id !== post.author_id)) {
      // 관리자 권한 확인
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (profile?.role !== 'admin') {
          return NextResponse.json(
            { error: '게시글을 볼 권한이 없습니다.' },
            { status: 403 }
          )
        }
      } else {
        return NextResponse.json(
          { error: '게시글을 볼 권한이 없습니다.' },
          { status: 403 }
        )
      }
    }

    // 조회수 증가 (승인된 게시글만)
    if (post.status === 'approved') {
      await supabase
        .from('posts')
        .update({ view_count: post.view_count + 1 })
        .eq('id', id)
      
      post.view_count = post.view_count + 1
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('게시글 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // 기존 게시글 조회
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, author_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('게시글 조회 에러:', fetchError)
      return NextResponse.json(
        { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 권한 확인 (작성자 본인 또는 관리자만 수정 가능)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const isAuthor = existingPost.author_id === session.user.id
    const isAdmin = profile?.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: '게시글을 수정할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content, excerpt, category_id, status } = body

    // 필수 필드 검증
    if (!title || !content || !category_id) {
      return NextResponse.json(
        { error: '제목, 내용, 카테고리는 필수입니다.' },
        { status: 400 }
      )
    }

    // 업데이트할 데이터 준비
    const updateData: {
      title: string
      content: string
      excerpt: string
      category_id: string
      tags?: string[]
      status?: string
      updated_at: string
    } = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      category_id,
      updated_at: new Date().toISOString()
    }

    // 관리자만 상태 변경 가능
    if (isAdmin && status && ['pending', 'approved', 'rejected'].includes(status)) {
      updateData.status = status
    }

    // 게시글 업데이트
    const { data: post, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
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
      console.error('게시글 업데이트 에러:', error)
      return NextResponse.json(
        { error: '게시글 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('게시글 수정 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // 기존 게시글 조회
    const { data: existingPost, error: fetchError } = await supabase
      .from('posts')
      .select('id, author_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('게시글 조회 에러:', fetchError)
      return NextResponse.json(
        { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 권한 확인 (작성자 본인 또는 관리자만 삭제 가능)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const isAuthor = existingPost.author_id === session.user.id
    const isAdmin = profile?.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: '게시글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 게시글 삭제
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('게시글 삭제 에러:', error)
      return NextResponse.json(
        { error: '게시글 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '게시글이 성공적으로 삭제되었습니다.' })
  } catch (error) {
    console.error('게시글 삭제 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}