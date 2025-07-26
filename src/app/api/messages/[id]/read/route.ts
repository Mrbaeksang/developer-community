import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, validateUUID } from '@/lib/security'

// PUT /api/messages/[id]/read - 메시지를 읽음으로 표시
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
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
            }
          }
        }
      }
    )
    
    const { id } = await params

    // UUID validation
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 메시지 ID입니다.' },
        { status: 400 }
      )
    }

    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 메시지 소유자 확인
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, recipient_id, is_read, read_at')
      .eq('id', id)
      .single()

    if (messageError || !message) {
      return NextResponse.json({ error: '메시지를 찾을 수 없습니다' }, { status: 404 })
    }

    // 수신자 본인인지 확인
    if (message.recipient_id !== session.user.id) {
      return NextResponse.json({ error: '메시지를 읽을 권한이 없습니다' }, { status: 403 })
    }

    // 이미 읽은 메시지인 경우
    if (message.is_read) {
      return NextResponse.json({ 
        message: '이미 읽은 메시지입니다',
        is_read: true,
        read_at: message.read_at 
      })
    }

    // 메시지를 읽음으로 표시
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, is_read, read_at')
      .single()

    if (updateError) {
      console.error('메시지 읽음 처리 실패:', updateError)
      return NextResponse.json({ error: '메시지 읽음 처리에 실패했습니다' }, { status: 500 })
    }

    // 읽지 않은 메시지 개수 업데이트를 위한 추가 정보 조회
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', session.user.id)
      .eq('is_read', false)

    return NextResponse.json({
      message: '메시지를 읽음으로 표시했습니다',
      is_read: updatedMessage.is_read,
      read_at: updatedMessage.read_at,
      unread_count: unreadCount || 0
    })
  } catch (error) {
    console.error('메시지 읽음 처리 오류:', error)
    return NextResponse.json({ error: '메시지 읽음 처리에 실패했습니다' }, { status: 500 })
  }
}