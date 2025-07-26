import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 커뮤니티 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id, postId } = await params
    const supabase = await createClient()
    
    // 현재 사용자 확인
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
        { error: '커뮤니티 멤버만 게시글을 볼 수 있습니다' },
        { status: 403 }
      )
    }

    // 게시글 조회
    const { data: post, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(
          id,
          username,
          avatar_url
        ),
        comments:community_post_comments(
          *,
          author:profiles!community_post_comments_author_id_fkey(
            id,
            username,
            avatar_url
          )
        )
      `)
      .eq('id', postId)
      .eq('community_id', id)
      .single()

    if (error) {
      console.error('Error fetching community post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error in community post detail:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// PATCH: 커뮤니티 게시글 수정
export async function PATCH(
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

    const body = await request.json()
    const { title, content, is_pinned } = body

    // 게시글 작성자 확인
    const { data: post } = await supabase
      .from('community_posts')
      .select('author_id')
      .eq('id', postId)
      .eq('community_id', id)
      .single()

    if (!post || post.author_id !== user.id) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 게시글 수정
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned
    updateData.updated_at = new Date().toISOString()

    const { data: updatedPost, error } = await supabase
      .from('community_posts')
      .update(updateData)
      .eq('id', postId)
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
      console.error('Error updating community post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error('Error in update community post:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// DELETE: 커뮤니티 게시글 삭제
export async function DELETE(
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

    // 게시글 작성자 확인
    const { data: post } = await supabase
      .from('community_posts')
      .select('author_id')
      .eq('id', postId)
      .eq('community_id', id)
      .single()

    if (!post || post.author_id !== user.id) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다' },
        { status: 403 }
      )
    }

    // 게시글 삭제
    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', postId)

    if (error) {
      console.error('Error deleting community post:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: '게시글이 삭제되었습니다' })
  } catch (error) {
    console.error('Error in delete community post:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}