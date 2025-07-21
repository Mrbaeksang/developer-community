import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: 게시글 승인
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
    }

    const { id } = await params
    const postId = id

    // 게시글 존재 및 상태 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, title, status, author_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 })
    }

    // 이미 승인된 게시글인지 확인
    if (post.status === 'approved') {
      return NextResponse.json({ error: '이미 승인된 게시글입니다' }, { status: 400 })
    }

    // 게시글 승인 처리
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'approved',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      console.error('게시글 승인 실패:', updateError)
      return NextResponse.json({ error: '게시글 승인에 실패했습니다' }, { status: 500 })
    }

    // 관리자 로그 기록
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: session.user.id,
        action: 'post_approved',
        target_type: 'post',
        target_id: postId,
        details: {
          post_title: post.title,
          author_id: post.author_id
        }
      })

    return NextResponse.json({ 
      message: '게시글이 승인되었습니다',
      post: updatedPost
    })
  } catch (error) {
    console.error('게시글 승인 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류' }, { status: 500 })
  }
}