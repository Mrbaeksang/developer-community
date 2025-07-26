import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, requireAuth, validateUUID } from '@/lib/security'

/**
 * GET /api/messages/[id]
 * 특정 메시지 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 인증 확인
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

    const { id: messageId } = params

    // UUID 유효성 검사
    if (!validateUUID(messageId)) {
      return NextResponse.json(
        { error: 'Invalid message ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 메시지 조회 (발신자 또는 수신자만 조회 가능)
    const { data: message, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        ),
        receiver:profiles!messages_receiver_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('id', messageId)
      .single()

    if (error || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // 권한 확인 (발신자 또는 수신자만 조회 가능)
    if (message.sender_id !== session.user.id && message.receiver_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 수신자인 경우 읽음 처리
    if (message.receiver_id === session.user.id && !message.is_read) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Get message exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/messages/[id]
 * 메시지 업데이트 (읽음 처리)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 인증 확인
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

    const { id: messageId } = params

    // UUID 유효성 검사
    if (!validateUUID(messageId)) {
      return NextResponse.json(
        { error: 'Invalid message ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { is_read } = body

    // 메시지가 수신자 것인지 확인
    const { data: message, error: checkError } = await supabase
      .from('messages')
      .select('id, receiver_id')
      .eq('id', messageId)
      .single()

    if (checkError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // 수신자만 읽음 상태 변경 가능
    if (message.receiver_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Only receiver can update read status' },
        { status: 403 }
      )
    }

    // 메시지 업데이트
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({
        is_read: is_read ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        ),
        receiver:profiles!messages_receiver_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (updateError) {
      console.error('Update message error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedMessage)
  } catch (error) {
    console.error('Update message exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/messages/[id]
 * 메시지 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 인증 확인
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

    const { id: messageId } = params

    // UUID 유효성 검사
    if (!validateUUID(messageId)) {
      return NextResponse.json(
        { error: 'Invalid message ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 메시지 소유자 확인
    const { data: message, error: checkError } = await supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .eq('id', messageId)
      .single()

    if (checkError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // 발신자 또는 수신자만 삭제 가능
    if (message.sender_id !== session.user.id && message.receiver_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 메시지 삭제
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (deleteError) {
      console.error('Delete message error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Message deleted successfully',
    })
  } catch (error) {
    console.error('Delete message exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}