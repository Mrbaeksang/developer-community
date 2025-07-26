import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/test-data/admin
 * 관리자 기능 테스트 데이터 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const createdIds: string[] = []
    
    // 승인 대기 중인 테스트 게시글 5개 생성
    const pendingPosts = [
      {
        id: 'dd0e8400-e29b-41d4-a716-446655440001',
        title: '[승인대기] GraphQL 입문 가이드',
        slug: 'graphql-intro-guide-pending',
        content: `# GraphQL 입문 가이드\n\n## GraphQL이란?\nGraphQL은 API를 위한 쿼리 언어입니다.\n\n## 주요 특징\n- 필요한 데이터만 요청\n- 단일 엔드포인트\n- 타입 시스템\n\n이 글은 관리자 승인 대기 중입니다.`,
        summary: 'GraphQL의 기본 개념과 사용법을 알아봅니다.',
        status: 'pending' as const,
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
        category_id: '257ea94b-e0a3-4db4-b3fe-dd1363d71205',
        author_id: user.id,
        view_count: 0,
        like_count: 0,
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1시간 전
        updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        id: 'dd0e8400-e29b-41d4-a716-446655440002',
        title: '[승인대기] Docker Compose 실전 활용법',
        slug: 'docker-compose-practice-pending',
        content: `# Docker Compose 실전 활용법\n\n## Docker Compose란?\n여러 컨테이너를 정의하고 실행하는 도구입니다.\n\n## 실전 예제\n- 웹 애플리케이션 스택 구성\n- 데이터베이스 연동\n- 네트워크 설정\n\n관리자 검토가 필요한 글입니다.`,
        summary: 'Docker Compose를 활용한 실전 예제를 소개합니다.',
        status: 'pending' as const,
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
        category_id: '257ea94b-e0a3-4db4-b3fe-dd1363d71205',
        author_id: user.id,
        view_count: 0,
        like_count: 0,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: 'dd0e8400-e29b-41d4-a716-446655440003',
        title: '[승인대기] Redis 캐싱 전략',
        slug: 'redis-caching-strategy-pending',
        content: `# Redis 캐싱 전략\n\n## 캐싱이란?\n자주 사용되는 데이터를 빠르게 접근 가능한 저장소에 보관하는 기법입니다.\n\n## Redis 캐싱 패턴\n- Cache Aside\n- Write Through\n- Write Behind\n\n승인 후 게시될 예정입니다.`,
        summary: 'Redis를 활용한 효과적인 캐싱 전략을 알아봅니다.',
        status: 'pending' as const,
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
        category_id: '257ea94b-e0a3-4db4-b3fe-dd1363d71205',
        author_id: user.id,
        view_count: 0,
        like_count: 0,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3시간 전
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
      },
      {
        id: 'dd0e8400-e29b-41d4-a716-446655440004',
        title: '[승인대기] Kubernetes 기초',
        slug: 'kubernetes-basics-pending',
        content: `# Kubernetes 기초\n\n## Kubernetes란?\n컨테이너 오케스트레이션 플랫폼입니다.\n\n## 주요 개념\n- Pod\n- Service\n- Deployment\n- Ingress\n\n관리자 승인 대기 중입니다.`,
        summary: 'Kubernetes의 기본 개념을 이해하고 시작해봅니다.',
        status: 'pending' as const,
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
        category_id: '257ea94b-e0a3-4db4-b3fe-dd1363d71205',
        author_id: user.id,
        view_count: 0,
        like_count: 0,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4시간 전
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      },
      {
        id: 'dd0e8400-e29b-41d4-a716-446655440005',
        title: '[승인대기] WebSocket 실시간 통신',
        slug: 'websocket-realtime-pending',
        content: `# WebSocket 실시간 통신\n\n## WebSocket이란?\n양방향 통신을 지원하는 프로토콜입니다.\n\n## 활용 사례\n- 실시간 채팅\n- 라이브 알림\n- 협업 도구\n\n검토 후 게시 예정입니다.`,
        summary: 'WebSocket을 활용한 실시간 통신 구현 방법을 소개합니다.',
        status: 'pending' as const,
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
        category_id: '257ea94b-e0a3-4db4-b3fe-dd1363d71205',
        author_id: user.id,
        view_count: 0,
        like_count: 0,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5시간 전
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
      }
    ]

    // 승인 대기 게시글 생성
    const { data: posts, error: postError } = await supabase
      .from('posts')
      .upsert(pendingPosts, { onConflict: 'id' })
      .select()

    if (postError) {
      console.error('Pending posts creation error:', postError)
      throw new Error('승인 대기 게시글 생성 실패')
    }

    createdIds.push(...pendingPosts.map(p => p.id))

    // 신고된 댓글 테스트 데이터 3개 생성
    const reportedComments = [
      {
        id: 'dd1e8400-e29b-41d4-a716-446655440010',
        post_id: '550e8400-e29b-41d4-a716-446655440010', // 기존 테스트 게시글
        author_id: user.id,
        content: '이 내용은 잘못된 정보입니다. (신고된 댓글 테스트)',
        parent_id: null,
        is_reported: true,
        report_count: 3,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30분 전
        updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: 'dd1e8400-e29b-41d4-a716-446655440011',
        post_id: '550e8400-e29b-41d4-a716-446655440011',
        author_id: user.id,
        content: '스팸 링크: example.com (신고된 댓글 테스트)',
        parent_id: null,
        is_reported: true,
        report_count: 5,
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45분 전
        updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      },
      {
        id: 'dd1e8400-e29b-41d4-a716-446655440012',
        post_id: '550e8400-e29b-41d4-a716-446655440012',
        author_id: user.id,
        content: '부적절한 언어 사용 (신고된 댓글 테스트)',
        parent_id: null,
        is_reported: true,
        report_count: 2,
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1시간 전
        updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      }
    ]

    // 신고된 댓글 생성
    const { data: comments, error: commentError } = await supabase
      .from('post_comments')
      .upsert(reportedComments, { onConflict: 'id' })
      .select()

    if (commentError) {
      console.error('Reported comments creation error:', commentError)
      // 댓글 생성 실패는 무시 (선택사항)
    }

    if (comments) {
      createdIds.push(...comments.map(c => c.id))
    }

    // 통계 데이터는 실제 데이터베이스 상태를 반영하므로 별도 생성 불필요

    return NextResponse.json({
      success: true,
      createdIds,
      summary: {
        '승인대기게시글': posts?.length || 0,
        '신고된댓글': comments?.length || 0
      }
    })
  } catch (error) {
    console.error('Test admin data creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create test admin data' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/test-data/admin
 * 관리자 기능 테스트 데이터 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 테스트 게시글 ID 패턴
    const testPostIds = [
      'dd0e8400-e29b-41d4-a716-446655440001',
      'dd0e8400-e29b-41d4-a716-446655440002',
      'dd0e8400-e29b-41d4-a716-446655440003',
      'dd0e8400-e29b-41d4-a716-446655440004',
      'dd0e8400-e29b-41d4-a716-446655440005'
    ]

    // 테스트 댓글 ID 패턴
    const testCommentIds = [
      'dd1e8400-e29b-41d4-a716-446655440010',
      'dd1e8400-e29b-41d4-a716-446655440011',
      'dd1e8400-e29b-41d4-a716-446655440012'
    ]

    // 댓글 삭제
    await supabase
      .from('post_comments')
      .delete()
      .in('id', testCommentIds)

    // 게시글 삭제
    const { error: postDeleteError } = await supabase
      .from('posts')
      .delete()
      .in('id', testPostIds)

    if (postDeleteError) {
      throw postDeleteError
    }

    return NextResponse.json({
      success: true,
      message: '관리자 기능 테스트 데이터가 삭제되었습니다'
    })
  } catch (error) {
    console.error('Test admin data deletion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete test admin data' },
      { status: 500 }
    )
  }
}