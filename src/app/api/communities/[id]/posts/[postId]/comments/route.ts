import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: 커뮤니티 게시글 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params
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
        { error: '커뮤니티 멤버만 댓글을 작성할 수 있습니다' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    // 댓글 생성
    const { data: comment, error } = await supabase
      .from('community_post_comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content
      })
      .select(`
        *,
        author:profiles!community_post_comments_author_id_fkey(
          id,
          username,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    console.error('Error in create comment:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}