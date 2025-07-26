import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/test-data/posts
 * 게시글 관련 테스트 데이터 생성
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

    // 1. 테스트 게시글 생성 (3개)
    const testPosts = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        title: '테스트 게시글 1 - React 성능 최적화',
        content: '# React 성능 최적화 가이드\n\n## 1. useMemo와 useCallback 활용\n\n리액트에서 성능을 최적화하는 방법입니다.',
        excerpt: 'React에서 useMemo와 useCallback을 활용한 성능 최적화 방법을 소개합니다.',
        author_id: user.id,
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885', // knowledge
        category_id: '257ea94b-e0a3-4db4-b3fe-dd1363d71205', // react
        status: 'published',
        view_count: 42,
        like_count: 5,
        tags: ['react', 'performance', 'optimization'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        title: '테스트 게시글 2 - TypeScript 타입 시스템',
        content: '# TypeScript 타입 시스템 이해하기\n\n## 제네릭과 타입 추론\n\n타입스크립트의 강력한 타입 시스템을 활용하는 방법입니다.',
        excerpt: 'TypeScript의 제네릭과 타입 추론을 통한 강력한 타입 시스템 활용법을 설명합니다.',
        author_id: user.id,
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
        category_id: '257ea94b-e0a3-4db4-b3fe-dd1363d71205', // react 카테고리 사용
        status: 'published',
        view_count: 35,
        like_count: 3,
        tags: ['typescript', 'types', 'generics'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        title: '테스트 게시글 3 - 승인 대기중',
        content: '# 승인 대기중인 게시글\n\n이 게시글은 아직 승인되지 않았습니다.',
        excerpt: '관리자 승인을 기다리고 있는 테스트 게시글입니다.',
        author_id: user.id,
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
        category_id: '257ea94b-e0a3-4db4-b3fe-dd1363d71205',
        status: 'pending',
        view_count: 0,
        like_count: 0,
        tags: ['test', 'pending'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .upsert(testPosts, { onConflict: 'id' })
      .select()

    if (postsError) {
      console.error('Posts creation error:', postsError)
      throw postsError
    }
    createdIds.push(...posts.map(p => p.id))

    // 2. 테스트 댓글 생성 (4개)
    const testComments = [
      {
        id: '660e8400-e29b-41d4-a716-446655440010',
        post_id: '550e8400-e29b-41d4-a716-446655440010',
        author_id: user.id,
        content: '좋은 글 감사합니다! React 최적화에 대해 잘 배웠습니다.',
        parent_id: null
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440011',
        post_id: '550e8400-e29b-41d4-a716-446655440010',
        author_id: user.id,
        content: '저도 도움이 되었습니다!',
        parent_id: '660e8400-e29b-41d4-a716-446655440010'
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440012',
        post_id: '550e8400-e29b-41d4-a716-446655440011',
        author_id: user.id,
        content: 'TypeScript 제네릭 부분이 특히 유용했습니다.',
        parent_id: null
      },
      {
        id: '660e8400-e29b-41d4-a716-446655440013',
        post_id: '550e8400-e29b-41d4-a716-446655440011',
        author_id: user.id,
        content: '타입 추론 예제가 더 있었으면 좋겠네요.',
        parent_id: null
      }
    ]

    const { data: comments, error: commentsError } = await supabase
      .from('post_comments')
      .upsert(testComments, { onConflict: 'id' })
      .select()

    if (commentsError) {
      console.error('Comments creation error:', commentsError)
      throw commentsError
    }
    createdIds.push(...comments.map(c => c.id))

    // 3. 테스트 좋아요 생성 (2개)
    const testLikes = [
      {
        post_id: '550e8400-e29b-41d4-a716-446655440010',
        user_id: user.id
      },
      {
        post_id: '550e8400-e29b-41d4-a716-446655440011',
        user_id: user.id
      }
    ]

    const { error: likesError } = await supabase
      .from('post_likes')
      .upsert(testLikes, { onConflict: 'post_id,user_id' })

    if (likesError) {
      console.error('Likes creation error:', likesError)
      // 좋아요는 중복될 수 있으므로 에러를 무시합니다
    }

    // 4. 테스트 태그 생성
    const testTags = [
      { name: 'react', slug: 'react' },
      { name: 'typescript', slug: 'typescript' },
      { name: 'performance', slug: 'performance' },
      { name: 'optimization', slug: 'optimization' }
    ]

    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .upsert(testTags, { onConflict: 'slug' })
      .select()

    if (tagsError) {
      console.error('Tags creation error:', tagsError)
      // 태그는 중복될 수 있으므로 에러를 무시합니다
    }

    return NextResponse.json({
      success: true,
      createdIds,
      summary: {
        posts: posts.length,
        comments: comments.length,
        likes: testLikes.length,
        tags: tags?.length || 0
      }
    })
  } catch (error) {
    console.error('Test data creation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create test data',
        details: error.message || error.toString()
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/test-data/posts
 * 게시글 관련 테스트 데이터 삭제
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
    const testPostIds = [
      '550e8400-e29b-41d4-a716-446655440010',
      '550e8400-e29b-41d4-a716-446655440011',
      '550e8400-e29b-41d4-a716-446655440012'
    ]

    const testCommentIds = [
      '660e8400-e29b-41d4-a716-446655440010',
      '660e8400-e29b-41d4-a716-446655440011',
      '660e8400-e29b-41d4-a716-446655440012',
      '660e8400-e29b-41d4-a716-446655440013'
    ]

    // 1. 좋아요 삭제 (참조 무결성 때문에 먼저 삭제)
    await supabase
      .from('post_likes')
      .delete()
      .in('post_id', testPostIds)

    // 2. 댓글 삭제
    await supabase
      .from('post_comments')
      .delete()
      .in('id', testCommentIds)

    // 3. 게시글 삭제
    await supabase
      .from('posts')
      .delete()
      .in('id', testPostIds)

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