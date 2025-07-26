import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/test-data/communities
 * 커뮤니티 관련 테스트 데이터 생성
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

    // 1. 테스트 커뮤니티 생성 (2개)
    const testCommunities = [
      {
        id: '770e8400-e29b-41d4-a716-446655440020',
        name: '테스트 프론트엔드 스터디',
        description: 'React와 TypeScript를 공부하는 스터디 그룹입니다.',
        tags: ['react', 'typescript', 'frontend'],
        visibility: 'public' as const,
        max_members: 10,
        created_by: user.id
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440021',
        name: '테스트 알고리즘 스터디',
        description: '코딩테스트 준비를 위한 알고리즘 스터디입니다.',
        tags: ['algorithm', 'coding-test'],
        visibility: 'private' as const,
        max_members: 5,
        created_by: user.id
      }
    ]

    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .insert(testCommunities)
      .select()

    if (communitiesError) throw communitiesError
    createdIds.push(...communities.map(c => c.id))

    // 2. 커뮤니티 멤버 추가 (생성자를 자동으로 멤버로)
    const testMembers = communities.map(community => ({
      community_id: community.id,
      user_id: user.id,
      role: 'owner' as const,
      joined_at: new Date().toISOString()
    }))

    const { error: membersError } = await supabase
      .from('community_members')
      .insert(testMembers)

    if (membersError) throw membersError

    // 3. 테스트 메시지 생성 (3개)
    const testMessages = [
      {
        id: '880e8400-e29b-41d4-a716-446655440030',
        community_id: '770e8400-e29b-41d4-a716-446655440020',
        user_id: user.id,
        content: '안녕하세요! 프론트엔드 스터디 첫 메시지입니다.'
      },
      {
        id: '880e8400-e29b-41d4-a716-446655440031',
        community_id: '770e8400-e29b-41d4-a716-446655440020',
        user_id: user.id,
        content: '오늘 React Hooks에 대해 공부했습니다.'
      },
      {
        id: '880e8400-e29b-41d4-a716-446655440032',
        community_id: '770e8400-e29b-41d4-a716-446655440021',
        user_id: user.id,
        content: '백준 실버 문제 풀이 공유합니다.'
      }
    ]

    const { data: messages, error: messagesError } = await supabase
      .from('community_messages')
      .insert(testMessages)
      .select()

    if (messagesError) throw messagesError
    createdIds.push(...messages.map(m => m.id))

    // 4. 테스트 메모 생성 (2개)
    const testMemos = [
      {
        id: '990e8400-e29b-41d4-a716-446655440040',
        community_id: '770e8400-e29b-41d4-a716-446655440020',
        author_id: user.id,
        title: 'React 18 새로운 기능 정리',
        content: '# React 18 주요 기능\n\n## Concurrent Features\n- Suspense\n- useTransition\n- useDeferredValue'
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440041',
        community_id: '770e8400-e29b-41d4-a716-446655440021',
        author_id: user.id,
        title: 'DP 문제 풀이 전략',
        content: '# 동적 계획법 (DP)\n\n## 기본 개념\n- 메모이제이션\n- 타뷸레이션'
      }
    ]

    const { data: memos, error: memosError } = await supabase
      .from('community_memos')
      .insert(testMemos)
      .select()

    if (memosError) throw memosError
    createdIds.push(...memos.map(m => m.id))

    return NextResponse.json({
      success: true,
      createdIds,
      summary: {
        communities: communities.length,
        members: testMembers.length,
        messages: messages.length,
        memos: memos.length
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
 * DELETE /api/admin/test-data/communities
 * 커뮤니티 관련 테스트 데이터 삭제
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
    const testCommunityIds = [
      '770e8400-e29b-41d4-a716-446655440020',
      '770e8400-e29b-41d4-a716-446655440021'
    ]

    const testMessageIds = [
      '880e8400-e29b-41d4-a716-446655440030',
      '880e8400-e29b-41d4-a716-446655440031',
      '880e8400-e29b-41d4-a716-446655440032'
    ]

    const testMemoIds = [
      '990e8400-e29b-41d4-a716-446655440040',
      '990e8400-e29b-41d4-a716-446655440041'
    ]

    // 1. 메모 삭제
    await supabase
      .from('community_memos')
      .delete()
      .in('id', testMemoIds)

    // 2. 메시지 삭제
    await supabase
      .from('community_messages')
      .delete()
      .in('id', testMessageIds)

    // 3. 멤버십 삭제
    await supabase
      .from('community_members')
      .delete()
      .in('community_id', testCommunityIds)

    // 4. 커뮤니티 삭제
    await supabase
      .from('communities')
      .delete()
      .in('id', testCommunityIds)

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