import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, validateUUID, sanitizeInput, requireAuth } from '@/lib/security'
import { 
  executeWithRLSHandling,
  handleRLSError 
} from '@/lib/supabase/rls-error-handler'

interface Params {
  id: string
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const { id } = await params

    // UUID validation
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 댓글 ID입니다.' },
        { status: 400 }
      )
    }

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
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 기존 댓글 조회 - RLS 에러 처리 포함
    const commentResult = await executeWithRLSHandling(
      () => supabase
        .from('post_comments')
        .select('id, author_id, content')
        .eq('id', id)
        .single(),
      {
        context: '댓글 조회 (수정용)',
        userId: session.user.id,
        return404: true
      }
    )

    if (commentResult.error && !commentResult.isRLSError) {
      console.error('댓글 조회 에러:', commentResult.error)
      return NextResponse.json(
        { error: '댓글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const existingComment = commentResult.data
    if (!existingComment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
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

    // Input sanitization
    const sanitizedContent = sanitizeInput(content)

    // 댓글 업데이트 - RLS 에러 처리 포함
    const updateResult = await executeWithRLSHandling(
      () => supabase
        .from('post_comments')
        .update({
          content: sanitizedContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          id,
          content,
          created_at,
          updated_at,
          author_id,
          profiles!inner (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .single(),
      {
        context: '댓글 업데이트',
        userId: session.user.id,
        fallbackData: null
      }
    )

    if (updateResult.error && !updateResult.isRLSError) {
      console.error('댓글 업데이트 에러:', updateResult.error)
      return NextResponse.json(
        { error: '댓글 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const comment = updateResult.data
    if (!comment) {
      return NextResponse.json(
        { error: '댓글 수정에 실패했습니다.' },
        { status: 500 }
      )
    }

    const commentWithProfile = comment

    return NextResponse.json({ comment: commentWithProfile })
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
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const { id } = await params

    // UUID validation
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 댓글 ID입니다.' },
        { status: 400 }
      )
    }

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
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 기존 댓글 조회 - RLS 에러 처리 포함
    const commentResult = await executeWithRLSHandling(
      () => supabase
        .from('post_comments')
        .select('id, author_id, post_id')
        .eq('id', id)
        .single(),
      {
        context: '댓글 조회 (삭제용)',
        userId: session.user.id,
        return404: true
      }
    )

    if (commentResult.error && !commentResult.isRLSError) {
      console.error('댓글 조회 에러:', commentResult.error)
      return NextResponse.json(
        { error: '댓글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const existingComment = commentResult.data
    if (!existingComment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인 (작성자 본인 또는 관리자만 삭제 가능) - RLS 에러 처리 포함
    const profileResult = await executeWithRLSHandling(
      () => supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single(),
      {
        context: '사용자 프로필 조회 (권한 확인)',
        userId: session.user.id,
        fallbackData: { role: 'user' }
      }
    )

    const profile = profileResult.data

    const isAuthor = existingComment.author_id === session.user.id
    const isAdmin = profile?.role === 'admin'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: '댓글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 댓글 삭제 - RLS 에러 처리 포함
    const deleteResult = await executeWithRLSHandling(
      () => supabase
        .from('post_comments')
        .delete()
        .eq('id', id),
      {
        context: '댓글 삭제',
        userId: session.user.id,
        fallbackData: null
      }
    )

    if (deleteResult.error && !deleteResult.isRLSError) {
      console.error('댓글 삭제 에러:', deleteResult.error)
      return NextResponse.json(
        { error: '댓글 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 게시글의 댓글 수 감소 - RLS 에러 처리 포함
    const postResult = await executeWithRLSHandling(
      () => supabase
        .from('posts')
        .select('comment_count')
        .eq('id', existingComment.post_id)
        .single(),
      {
        context: '게시글 댓글 수 조회',
        userId: session.user.id,
        fallbackData: null
      }
    )

    const currentPost = postResult.data
    if (currentPost && !postResult.isRLSError) {
      await executeWithRLSHandling(
        () => supabase
          .from('posts')
          .update({ comment_count: Math.max((currentPost.comment_count || 0) - 1, 0) })
          .eq('id', existingComment.post_id),
        {
          context: '게시글 댓글 수 감소',
          userId: session.user.id,
          fallbackData: null
        }
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