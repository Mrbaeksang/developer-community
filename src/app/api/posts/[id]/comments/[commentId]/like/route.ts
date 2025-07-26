import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, validateUUID } from '@/lib/security'

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

    // 댓글 존재 확인
    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .select('id, post_id')
      .eq('id', commentId)
      .eq('post_id', id)
      .single()

    if (commentError) {
      if (commentError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '댓글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('댓글 조회 에러:', commentError)
      return NextResponse.json(
        { error: '댓글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 이미 좋아요했는지 확인
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', session.user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('좋아요 확인 에러:', checkError)
      return NextResponse.json(
        { error: '좋아요 상태 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (existingLike) {
      return NextResponse.json(
        { error: '이미 좋아요한 댓글입니다.' },
        { status: 409 }
      )
    }

    // 좋아요 추가
    const { error: likeError } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: session.user.id
      })

    if (likeError) {
      console.error('댓글 좋아요 추가 에러:', likeError)
      return NextResponse.json(
        { error: '좋아요 추가 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 댓글의 좋아요 수 증가
    const { data: currentComment } = await supabase
      .from('post_comments')
      .select('like_count')
      .eq('id', commentId)
      .single()

    if (currentComment) {
      await supabase
        .from('post_comments')
        .update({ like_count: (currentComment.like_count || 0) + 1 })
        .eq('id', commentId)
    }

    return NextResponse.json({ 
      success: true,
      liked: true
    }, { status: 200 })
  } catch (error) {
    console.error('댓글 좋아요 예외:', error)
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

    // 댓글 존재 확인
    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .select('id, post_id')
      .eq('id', commentId)
      .eq('post_id', id)
      .single()

    if (commentError) {
      if (commentError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '댓글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('댓글 조회 에러:', commentError)
      return NextResponse.json(
        { error: '댓글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 좋아요 존재 확인
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', session.user.id)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '좋아요하지 않은 댓글입니다.' },
          { status: 404 }
        )
      }
      console.error('좋아요 확인 에러:', checkError)
      return NextResponse.json(
        { error: '좋아요 상태 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 좋아요 삭제
    const { error: deleteError } = await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', session.user.id)

    if (deleteError) {
      console.error('댓글 좋아요 삭제 에러:', deleteError)
      return NextResponse.json(
        { error: '좋아요 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 댓글의 좋아요 수 감소
    const { data: currentComment } = await supabase
      .from('post_comments')
      .select('like_count')
      .eq('id', commentId)
      .single()

    if (currentComment && currentComment.like_count > 0) {
      await supabase
        .from('post_comments')
        .update({ like_count: currentComment.like_count - 1 })
        .eq('id', commentId)
    }

    return NextResponse.json({ 
      success: true,
      liked: false
    }, { status: 200 })
  } catch (error) {
    console.error('댓글 좋아요 취소 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}