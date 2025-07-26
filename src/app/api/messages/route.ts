import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, requireAuth } from '@/lib/security'
import type { MessageFilters, CreateMessageData } from '@/types/message'

/**
 * GET /api/messages
 * 사용자의 메시지 목록 조회
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 인증 확인
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

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

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // all, sent, received
    const isRead = searchParams.get('is_read')
    const threadId = searchParams.get('thread_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 메시지 조회
    let query = supabase
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

    // 타입별 필터
    if (type === 'sent') {
      query = query.eq('sender_id', session.user.id)
    } else if (type === 'received') {
      query = query.eq('receiver_id', session.user.id)
    } else {
      // all: 보낸 메시지와 받은 메시지 모두
      query = query.or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
    }

    // 읽음 상태 필터
    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true')
    }

    // 스레드 필터
    if (threadId) {
      query = query.eq('thread_id', threadId)
    }

    // 정렬 및 페이지네이션
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: messages, error } = await query

    if (error) {
      console.error('Get messages error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // 읽지 않은 메시지 수 조회
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', session.user.id)
      .eq('is_read', false)

    // 전체 메시지 수 조회
    let totalQuery = supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })

    if (type === 'sent') {
      totalQuery = totalQuery.eq('sender_id', session.user.id)
    } else if (type === 'received') {
      totalQuery = totalQuery.eq('receiver_id', session.user.id)
    } else {
      totalQuery = totalQuery.or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
    }

    if (isRead !== null) {
      totalQuery = totalQuery.eq('is_read', isRead === 'true')
    }
    if (threadId) {
      totalQuery = totalQuery.eq('thread_id', threadId)
    }

    const { count: totalCount } = await totalQuery

    return NextResponse.json({
      messages: messages || [],
      total: totalCount || 0,
      unread_count: unreadCount || 0,
      has_more: offset + limit < (totalCount || 0),
    })
  } catch (error) {
    console.error('Get messages exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messages
 * 새 메시지 전송
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 인증 확인
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

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

    const body: CreateMessageData = await request.json()
    const { receiver_id, content, thread_id } = body

    // 유효성 검사
    if (!receiver_id || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      )
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Message content is too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // 자기 자신에게 메시지 전송 방지
    if (receiver_id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      )
    }

    // 수신자 존재 확인
    const { data: receiver, error: receiverError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', receiver_id)
      .single()

    if (receiverError || !receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      )
    }

    // 메시지 생성
    const { data: message, error: createError } = await supabase
      .from('messages')
      .insert({
        sender_id: session.user.id,
        receiver_id,
        content: content.trim(),
        thread_id: thread_id || null,
        is_read: false,
      })
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

    if (createError) {
      console.error('Create message error:', createError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // 알림 생성 (선택적)
    await supabase
      .from('notifications')
      .insert({
        user_id: receiver_id,
        type: 'message',
        title: '새 메시지',
        message: `${session.user.user_metadata?.display_name || '사용자'}님이 메시지를 보냈습니다.`,
        related_id: message.id,
        related_type: 'message',
        is_read: false,
      })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Create message exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}