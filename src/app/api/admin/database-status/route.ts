/**
 * 데이터베이스 상태 확인 API
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts, free_post_comments, free_post_likes 테이블 없음!
 * - ✅ posts, post_comments, post_likes 테이블만 존재
 * - 📌 이 파일의 32-36라인에 잘못된 테이블명 사용!
 *   - free_posts → posts (조건: board_type='forum')
 *   - free_post_comments → post_comments
 *   - free_post_likes → post_likes
 * 
 * ⚠️ 주의: 61-66, 74-79라인에서도 잘못된 테이블명 사용 중!
 * 실제로는 posts 테이블에서 board_type_id로 필터링해야 함
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/database-status
 * 데이터베이스 테이블별 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 프로필에서 role 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 각 테이블의 레코드 수 조회 (한글 설명 포함)
    const tables = [
      // 사용자 관련
      { name: 'profiles', label: '사용자 프로필', page: '/profile' },
      { name: 'user_activities', label: '사용자 활동', page: '/admin' },
      { name: 'password_reset_tokens', label: '비밀번호 재설정', page: '/auth' },
      
      // 게시글 관련
      { name: 'board_types', label: '게시판 타입', page: '/admin' },
      { name: 'categories', label: '카테고리', page: '/admin' },
      { name: 'posts', label: '전체 게시글', page: '/knowledge' },
      { name: 'post_comments', label: '댓글', page: '/knowledge/[id]' },
      { name: 'post_likes', label: '좋아요', page: '/knowledge/[id]' },
      { name: 'comment_likes', label: '댓글 좋아요', page: '/knowledge/[id]' },
      { name: 'post_bookmarks', label: '북마크', page: '/knowledge/[id]' },
      { name: 'post_attachments', label: '첨부파일', page: '/knowledge/[id]' },
      { name: 'post_approvals', label: '승인 기록', page: '/admin/posts/pending' },
      { name: 'tags', label: '태그', page: '/knowledge' },
      
      // 커뮤니티 관련
      { name: 'communities', label: '커뮤니티', page: '/communities' },
      { name: 'community_members', label: '커뮤니티 멤버', page: '/communities/[id]' },
      { name: 'community_join_requests', label: '가입 요청', page: '/communities/[id]' },
      { name: 'community_posts', label: '커뮤니티 게시글', page: '/communities/[id]/posts' },
      { name: 'community_post_comments', label: '커뮤니티 댓글', page: '/communities/[id]/posts' },
      { name: 'community_post_likes', label: '커뮤니티 좋아요', page: '/communities/[id]/posts' },
      { name: 'community_comment_likes', label: '커뮤니티 댓글 좋아요', page: '/communities/[id]/posts' },
      { name: 'community_messages', label: '커뮤니티 채팅', page: '/communities/[id]' },
      { name: 'community_memos', label: '커뮤니티 메모', page: '/communities/[id]' },
      { name: 'community_files', label: '커뮤니티 파일', page: '/communities/[id]' },
      
      // 기타
      { name: 'messages', label: '직접 메시지', page: '/messages' },
      { name: 'notifications', label: '알림', page: '/notifications' },
      { name: 'admin_logs', label: '관리자 로그', page: '/admin' }
    ]

    const tableStatus = await Promise.all(
      tables.map(async (table) => {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })

        // 테스트 데이터 여부 확인 (각 테이블별 테스트 ID 패턴)
        let hasTestData = false
        
        if (table.name === 'posts') {
          const { count: testCount } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true })
            .in('id', ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012'])
          hasTestData = (testCount || 0) > 0
        } else if (table.name === 'communities') {
          const { count: testCount } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true })
            .in('id', ['770e8400-e29b-41d4-a716-446655440020', '770e8400-e29b-41d4-a716-446655440021'])
          hasTestData = (testCount || 0) > 0
        } else if (table.name === 'post_comments') {
          const { count: testCount } = await supabase
            .from(table.name)
            .select('*', { count: 'exact', head: true })
            .in('post_id', ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440012'])
          hasTestData = (testCount || 0) > 0
        }

        return {
          name: table.name,
          label: table.label,
          page: table.page,
          count: count || 0,
          hasTestData
        }
      })
    )

    return NextResponse.json({
      tables: tableStatus,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch database status' },
      { status: 500 }
    )
  }
}