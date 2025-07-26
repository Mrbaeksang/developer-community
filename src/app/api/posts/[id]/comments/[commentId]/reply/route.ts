import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, sanitizeInput, validateUUID } from '@/lib/security'

interface Params {
  id: string
  commentId: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const { id, commentId } = await params

    // UUID validation
    if (!validateUUID(id) || !validateUUID(commentId)) {
      return NextResponse.json(
        { error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

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

    if (post.status !== 'published') {
      return NextResponse.json(
        { error: '공개된 게시글만 댓글을 작성할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 부모 댓글 존재 확인
    const { data: parentComment, error: parentError } = await supabase
      .from('post_comments')
      .select('id, post_id')
      .eq('id', commentId)
      .eq('post_id', id)
      .single()

    if (parentError) {
      if (parentError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '댓글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('댓글 조회 에러:', parentError)
      return NextResponse.json(
        { error: '댓글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { content } = body

    // 필수 필드 검증
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '답글 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    // Input sanitization
    const sanitizedContent = sanitizeInput(content)

    // 답글 생성
    const { data: reply, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: id,
        author_id: session.user.id,
        content: sanitizedContent.trim(),
        parent_id: commentId
      })
      .select(`
        id,
        content,
        parent_id,
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
      .single()

    if (error) {
      console.error('답글 생성 에러:', error)
      return NextResponse.json(
        { error: '답글 작성 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 게시글의 댓글 수 증가
    const { data: currentPost } = await supabase
      .from('posts')
      .select('comment_count')
      .eq('id', id)
      .single()

    if (currentPost) {
      await supabase
        .from('posts')
        .update({ comment_count: (currentPost.comment_count || 0) + 1 })
        .eq('id', id)
    }

    // 답글 데이터 포맷팅
    const profile = (reply as Record<string, unknown>).profiles as { 
      id: string
      username: string | null
      display_name: string | null
      avatar_url: string | null
    } | undefined
    
    const formattedReply = {
      id: reply.id,
      content: reply.content,
      parent_id: reply.parent_id,
      created_at: reply.created_at,
      updated_at: reply.updated_at,
      author_id: reply.author_id,
      author: {
        id: reply.author_id,
        username: profile?.username || 'Unknown',
        display_name: profile?.display_name,
        avatar_url: profile?.avatar_url
      }
    }

    return NextResponse.json({ reply: formattedReply }, { status: 201 })
  } catch (error) {
    console.error('답글 작성 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}