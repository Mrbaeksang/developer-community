import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, requireAuth } from '@/lib/security'
import type { NotificationFilters } from '@/types/notification'

/**
 * GET /api/notifications
 * 사용자 알림 목록 조회
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
    const type = searchParams.get('type')
    const isRead = searchParams.get('is_read')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 알림 조회
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)

    // 필터 적용
    if (type) {
      query = query.eq('type', type)
    }
    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true')
    }

    // 정렬 및 페이지네이션
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: notifications, error } = await query

    if (error) {
      console.error('Get notifications error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // 읽지 않은 알림 수 조회
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)

    // 전체 알림 수 조회
    let totalQuery = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (type) {
      totalQuery = totalQuery.eq('type', type)
    }
    if (isRead !== null) {
      totalQuery = totalQuery.eq('is_read', isRead === 'true')
    }

    const { count: totalCount } = await totalQuery

    // 관련 데이터 추가 조회 (필요한 경우)
    const enhancedNotifications = await Promise.all(
      (notifications || []).map(async (notification) => {
        const relatedData: {
          post?: { id: string; title: string; slug: string };
          comment?: { id: string; content: string; post_id: string };
          community?: { id: string; name: string; slug: string };
        } = {}

        // 게시글 관련 알림
        if (notification.related_type === 'post' && notification.related_id) {
          const { data: post } = await supabase
            .from('posts')
            .select('id, title, slug')
            .eq('id', notification.related_id)
            .single()
          if (post) {
            relatedData.post = post
          }
        }

        // 댓글 관련 알림
        if (notification.related_type === 'comment' && notification.related_id) {
          const { data: comment } = await supabase
            .from('post_comments')
            .select('id, content, post_id')
            .eq('id', notification.related_id)
            .single()
          if (comment) {
            relatedData.comment = comment
          }
        }

        // 커뮤니티 관련 알림
        if (notification.related_type === 'community' && notification.related_id) {
          const { data: community } = await supabase
            .from('communities')
            .select('id, name, slug')
            .eq('id', notification.related_id)
            .single()
          if (community) {
            relatedData.community = community
          }
        }

        return {
          ...notification,
          related_data: relatedData,
        }
      })
    )

    return NextResponse.json({
      notifications: enhancedNotifications,
      total: totalCount || 0,
      unread_count: unreadCount || 0,
      has_more: offset + limit < (totalCount || 0),
    })
  } catch (error) {
    console.error('Get notifications exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}