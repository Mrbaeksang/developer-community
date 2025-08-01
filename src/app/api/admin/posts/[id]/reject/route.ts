import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, validateUUID, sanitizeInput, requireAdmin } from '@/lib/security'

// POST: 게시글 거부
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const adminCheck = await requireAdmin(request, supabase)
    if (adminCheck) return adminCheck

    // 세션 가져오기 (로그용)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { id } = await params
    const postId = id

    // UUID validation
    if (!validateUUID(postId)) {
      return NextResponse.json(
        { error: '유효하지 않은 게시글 ID입니다.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { reason } = body

    // 거부 사유 유효성 검사
    if (!reason?.trim()) {
      return NextResponse.json({ error: '거부 사유는 필수입니다' }, { status: 400 })
    }

    // Input sanitization
    const sanitizedReason = sanitizeInput(reason)

    // 게시글 존재 및 상태 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, title, status, author_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: '게시글을 찾을 수 없습니다' }, { status: 404 })
    }

    // 이미 거부된 게시글인지 확인
    if (post.status === 'rejected') {
      return NextResponse.json({ error: '이미 거부된 게시글입니다' }, { status: 400 })
    }

    // 게시글 거부 처리
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      console.error('게시글 거부 실패:', updateError)
      return NextResponse.json({ error: '게시글 거부에 실패했습니다' }, { status: 500 })
    }

    // 관리자 로그 기록
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: session.user.id,
        action: 'post_rejected',
        target_type: 'post',
        target_id: postId,
        details: {
          post_title: post.title,
          author_id: post.author_id,
          rejection_reason: sanitizedReason.trim()
        }
      })

    // TODO: 작성자에게 거부 알림 발송 (이메일/알림)
    // await sendRejectionNotification(post.author_id, post.title, reason)

    return NextResponse.json({ 
      message: '게시글이 거부되었습니다',
      post: updatedPost
    })
  } catch (error) {
    console.error('게시글 거부 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류' }, { status: 500 })
  }
}