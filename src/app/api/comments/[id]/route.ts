import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Params {
  id: string
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

    // 기존 댓글 조회
    const { data: existingComment, error: fetchError } = await supabase
      .from('post_comments')
      .select('id, author_id, content')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '댓글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('댓글 조회 에러:', fetchError)
      return NextResponse.json(
        { error: '댓글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 권한 확인 (작성자 본인만 수정 가능)
    if (existingComment.author_id !== session.user.id) {
      return NextResponse.json(
        { error: '본인이 작성한 댓글만 수정할 수 있습니다.' },
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

    // 댓글 업데이트
    const { data: comment, error } = await supabase
      .from('post_comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
      console.error('댓글 업데이트 에러:', error)
      return NextResponse.json(
        { error: '댓글 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('댓글 수정 예외:', error)
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

    // 기존 댓글 조회
    const { data: existingComment, error: fetchError } = await supabase
      .from('post_comments')
      .select('id, author_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '댓글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('댓글 조회 에러:', fetchError)
      return NextResponse.json(
        { error: '댓글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 권한 확인 (작성자 본인만 삭제 가능)
    if (existingComment.author_id !== session.user.id) {
      return NextResponse.json(
        { error: '본인이 작성한 댓글만 삭제할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 댓글 삭제
    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('댓글 삭제 에러:', error)
      return NextResponse.json(
        { error: '댓글 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '댓글이 성공적으로 삭제되었습니다.' })
  } catch (error) {
    console.error('댓글 삭제 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}