import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/admin/test-data
 * 모든 테스트 데이터 일괄 삭제
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

    // 모든 테스트 데이터 ID 패턴
    const testPatterns = {
      posts: [
        '550e8400-e29b-41d4-a716-446655440010',
        '550e8400-e29b-41d4-a716-446655440011',
        '550e8400-e29b-41d4-a716-446655440012'
      ],
      comments: [
        '660e8400-e29b-41d4-a716-446655440010',
        '660e8400-e29b-41d4-a716-446655440011',
        '660e8400-e29b-41d4-a716-446655440012',
        '660e8400-e29b-41d4-a716-446655440013'
      ],
      communities: [
        '770e8400-e29b-41d4-a716-446655440020',
        '770e8400-e29b-41d4-a716-446655440021'
      ],
      messages: [
        '880e8400-e29b-41d4-a716-446655440030',
        '880e8400-e29b-41d4-a716-446655440031',
        '880e8400-e29b-41d4-a716-446655440032'
      ],
      memos: [
        '990e8400-e29b-41d4-a716-446655440040',
        '990e8400-e29b-41d4-a716-446655440041'
      ],
      freePosts: [
        'aa0e8400-e29b-41d4-a716-446655440050',
        'aa0e8400-e29b-41d4-a716-446655440051',
        'aa0e8400-e29b-41d4-a716-446655440052'
      ],
      // 새로운 카테고리 테스트 데이터
      profiles: [
        'ee0e8400-e29b-41d4-a716-446655440001',
        'ee0e8400-e29b-41d4-a716-446655440002',
        'ee0e8400-e29b-41d4-a716-446655440003'
      ],
      categories: [
        'cc0e8400-e29b-41d4-a716-446655440001',
        'cc0e8400-e29b-41d4-a716-446655440002',
        'cc0e8400-e29b-41d4-a716-446655440003',
        'cc0e8400-e29b-41d4-a716-446655440004',
        'cc0e8400-e29b-41d4-a716-446655440005'
      ],
      adminPosts: [
        'dd0e8400-e29b-41d4-a716-446655440001',
        'dd0e8400-e29b-41d4-a716-446655440002',
        'dd0e8400-e29b-41d4-a716-446655440003',
        'dd0e8400-e29b-41d4-a716-446655440004',
        'dd0e8400-e29b-41d4-a716-446655440005'
      ],
      adminComments: [
        'dd1e8400-e29b-41d4-a716-446655440010',
        'dd1e8400-e29b-41d4-a716-446655440011',
        'dd1e8400-e29b-41d4-a716-446655440012'
      ],
      tagPattern: '%-test' // 태그 패턴
    }

    // 삭제 순서 (참조 무결성 고려)
    
    // 1. 자유게시판 관련
    await supabase.from('free_post_likes').delete().in('free_post_id', testPatterns.freePosts)
    await supabase.from('free_post_comments').delete().in('free_post_id', testPatterns.freePosts)
    await supabase.from('free_posts').delete().in('id', testPatterns.freePosts)

    // 2. 커뮤니티 관련
    await supabase.from('community_memos').delete().in('id', testPatterns.memos)
    await supabase.from('community_messages').delete().in('id', testPatterns.messages)
    await supabase.from('community_members').delete().in('community_id', testPatterns.communities)
    await supabase.from('communities').delete().in('id', testPatterns.communities)

    // 3. 게시글 관련
    await supabase.from('post_likes').delete().in('post_id', testPatterns.posts)
    await supabase.from('post_comments').delete().in('id', testPatterns.comments)
    await supabase.from('post_comments').delete().in('id', testPatterns.adminComments) // 관리자 테스트 댓글
    await supabase.from('posts').delete().in('id', testPatterns.posts)
    await supabase.from('posts').delete().in('id', testPatterns.adminPosts) // 관리자 테스트 게시글

    // 4. 카테고리 및 태그
    await supabase.from('categories').delete().in('id', testPatterns.categories)
    await supabase.from('tags').delete().like('name', testPatterns.tagPattern)

    // 5. 프로필 (마지막에 삭제)
    await supabase.from('profiles').delete().in('id', testPatterns.profiles)

    return NextResponse.json({
      success: true,
      message: 'All test data deleted successfully',
      deletedPatterns: testPatterns
    })
  } catch (error) {
    console.error('Test data deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete test data' },
      { status: 500 }
    )
  }
}