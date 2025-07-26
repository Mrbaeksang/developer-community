import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, requireAuth, validateUUID } from '@/lib/security'

/**
 * PATCH /api/notifications/[id]
 * 특정 알림 업데이트 (읽음 처리 등)
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

    const { id: notificationId } = params

    // UUID 유효성 검사
    if (!validateUUID(notificationId)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
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

    // 알림이 사용자 것인지 확인
    const { data: notification, error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', notificationId)
      .eq('user_id', session.user.id)
      .single()

    if (checkError || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    // 알림 업데이트
    const { data: updatedNotification, error: updateError } = await supabase
      .from('notifications')
      .update({
        is_read: is_read ?? true,
      })
      .eq('id', notificationId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update notification error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error('Update notification exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notifications/[id]
 * 특정 알림 삭제
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

    const { id: notificationId } = params

    // UUID 유효성 검사
    if (!validateUUID(notificationId)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
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

    // 알림 삭제 (사용자 소유 확인 포함)
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', session.user.id)

    if (deleteError) {
      console.error('Delete notification error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    console.error('Delete notification exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}