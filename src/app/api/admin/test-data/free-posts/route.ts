/**
 * 자유게시판 테스트 데이터 API
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts, free_post_comments, free_post_likes 테이블 없음!
 * - ✅ posts, post_comments, post_likes 테이블 사용
 * - 📌 이 파일의 코드는 잘못된 테이블명 사용!
 *   - 63라인: free_posts → posts
 *   - 111라인: free_post_comments → post_comments
 *   - 123라인: free_post_likes → post_likes
 * 
 * ⚠️ 주의: posts 테이블에 board_type_id 필드 추가 필요!
 * 자유게시판: board_type_id = '00f8f32b-faca-4947-94f5-812a0bb97c39'
 * 
 * 🔥 버그: board_type 필드가 아니라 board_type_id 사용해야 함!
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/test-data/free-posts
 * 자유게시판 관련 테스트 데이터 생성
 */
export async function POST(request: NextRequest) {
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

    const createdIds: string[] = []

    // 1. 테스트 자유게시판 게시글 생성 (3개)
    const testFreePosts = [
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440050',
        title: '취업 준비 팁 공유합니다',
        content: '안녕하세요! 최근 프론트엔드 개발자로 취업에 성공했습니다.\n\n## 포트폴리오 준비\n- GitHub 정리\n- 개인 프로젝트 2-3개\n- 기술 블로그 운영\n\n## 면접 준비\n- CS 기초 지식\n- JavaScript 심화\n- React/Vue 프레임워크\n\n화이팅하세요!',
        author_id: user.id,
        board_type: 'job',
        view_count: 128,
        like_count: 24
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440051',
        title: '개발자 일상 - 재택근무의 장단점',
        content: '재택근무 6개월차 후기입니다.\n\n### 장점\n- 출퇴근 시간 절약\n- 편안한 환경에서 집중\n- 유연한 시간 관리\n\n### 단점\n- 커뮤니케이션 어려움\n- 일과 삶의 경계 모호\n- 운동 부족\n\n여러분의 생각은 어떠신가요?',
        author_id: user.id,
        board_type: 'daily',
        view_count: 95,
        like_count: 15
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440052',
        title: '부트캠프 3개월 회고',
        content: '# 부트캠프 수료 회고\n\n드디어 3개월간의 부트캠프를 마쳤습니다.\n\n## 배운 것들\n- HTML/CSS/JavaScript 기초\n- React 프레임워크\n- Node.js & Express\n- MongoDB\n\n## 느낀 점\n정말 힘들었지만 많이 성장한 시간이었습니다.\n함께한 동료들 덕분에 끝까지 완주할 수 있었어요.\n\n## 앞으로의 계획\n- 개인 프로젝트 진행\n- 알고리즘 공부\n- 취업 준비\n\n모두 화이팅!',
        author_id: user.id,
        board_type: 'retrospect',
        view_count: 156,
        like_count: 32
      }
    ]

    const { data: freePosts, error: freePostsError } = await supabase
      .from('free_posts')
      .insert(testFreePosts)
      .select()

    if (freePostsError) throw freePostsError
    createdIds.push(...freePosts.map(p => p.id))

    // 2. 자유게시판 댓글 생성 (각 게시글당 2개씩)
    const testComments = [
      {
        free_post_id: 'aa0e8400-e29b-41d4-a716-446655440050',
        author_id: user.id,
        content: '좋은 정보 감사합니다! 저도 취준중인데 도움이 많이 되네요.',
        parent_id: null
      },
      {
        free_post_id: 'aa0e8400-e29b-41d4-a716-446655440050',
        author_id: user.id,
        content: '포트폴리오는 몇 개 정도 준비하셨나요?',
        parent_id: null
      },
      {
        free_post_id: 'aa0e8400-e29b-41d4-a716-446655440051',
        author_id: user.id,
        content: '저도 재택근무 중인데 공감이 많이 되네요!',
        parent_id: null
      },
      {
        free_post_id: 'aa0e8400-e29b-41d4-a716-446655440051',
        author_id: user.id,
        content: '운동은 정말 중요한 것 같아요. 홈트레이닝 추천합니다.',
        parent_id: null
      },
      {
        free_post_id: 'aa0e8400-e29b-41d4-a716-446655440052',
        author_id: user.id,
        content: '수고하셨습니다! 좋은 결과 있으시길 바랍니다.',
        parent_id: null
      },
      {
        free_post_id: 'aa0e8400-e29b-41d4-a716-446655440052',
        author_id: user.id,
        content: '저도 부트캠프 준비중인데 후기 잘 봤어요!',
        parent_id: null
      }
    ]

    const { error: commentsError } = await supabase
      .from('free_post_comments')
      .insert(testComments)

    if (commentsError) throw commentsError

    // 3. 좋아요 생성 (각 게시글당 1개씩)
    const testLikes = testFreePosts.map(post => ({
      free_post_id: post.id,
      user_id: user.id
    }))

    const { error: likesError } = await supabase
      .from('free_post_likes')
      .insert(testLikes)

    if (likesError) throw likesError

    return NextResponse.json({
      success: true,
      createdIds,
      summary: {
        freePosts: freePosts.length,
        comments: testComments.length,
        likes: testLikes.length
      }
    })
  } catch (error) {
    console.error('Test data creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create test data' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/test-data/free-posts
 * 자유게시판 관련 테스트 데이터 삭제
 */
export async function DELETE(request: NextRequest) {
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

    // 테스트 데이터 ID 패턴
    const testFreePostIds = [
      'aa0e8400-e29b-41d4-a716-446655440050',
      'aa0e8400-e29b-41d4-a716-446655440051',
      'aa0e8400-e29b-41d4-a716-446655440052'
    ]

    // 1. 좋아요 삭제
    await supabase
      .from('free_post_likes')
      .delete()
      .in('free_post_id', testFreePostIds)

    // 2. 댓글 삭제
    await supabase
      .from('free_post_comments')
      .delete()
      .in('free_post_id', testFreePostIds)

    // 3. 자유게시판 게시글 삭제
    await supabase
      .from('free_posts')
      .delete()
      .in('id', testFreePostIds)

    return NextResponse.json({
      success: true,
      message: 'Test data deleted successfully'
    })
  } catch (error) {
    console.error('Test data deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete test data' },
      { status: 500 }
    )
  }
}