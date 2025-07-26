import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, requireAuth } from '@/lib/security'

/**
 * POST /api/notifications/mark-all-read
 * 모든 알림을 읽음으로 표시
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

    // 모든 읽지 않은 알림을 읽음으로 표시
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)

    if (updateError) {
      console.error('Mark all notifications as read error:', updateError)
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      )
    }

    // 업데이트된 알림 개수 반환
    const { count: updatedCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', true)

    return NextResponse.json({
      message: 'All notifications marked as read',
      updated_count: updatedCount || 0,
    })
  } catch (error) {
    console.error('Mark all notifications as read exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}