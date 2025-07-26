import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/test-data/categories
 * 카테고리 및 태그 테스트 데이터 생성
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
    
    // 테스트 카테고리 데이터 (5개)
    const testCategories = [
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440001',
        name: 'Frontend Development',
        slug: 'frontend-dev-test',
        description: '프론트엔드 개발 관련 카테고리 (테스트)',
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885', // 지식공유 게시판
        is_active: true,
        sort_order: 100,
        created_at: new Date().toISOString()
      },
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440002',
        name: 'Backend Development',
        slug: 'backend-dev-test',
        description: '백엔드 개발 관련 카테고리 (테스트)',
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
        is_active: true,
        sort_order: 101,
        created_at: new Date().toISOString()
      },
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440003',
        name: 'DevOps',
        slug: 'devops-test',
        description: '데브옵스 관련 카테고리 (테스트)',
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
        is_active: true,
        sort_order: 102,
        created_at: new Date().toISOString()
      },
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440004',
        name: 'Mobile Development',
        slug: 'mobile-dev-test',
        description: '모바일 개발 관련 카테고리 (테스트)',
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
        is_active: true,
        sort_order: 103,
        created_at: new Date().toISOString()
      },
      {
        id: 'cc0e8400-e29b-41d4-a716-446655440005',
        name: 'AI/ML',
        slug: 'ai-ml-test',
        description: '인공지능 및 머신러닝 카테고리 (테스트)',
        board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
        is_active: true,
        sort_order: 104,
        created_at: new Date().toISOString()
      }
    ]

    // 카테고리 생성
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .upsert(testCategories, { onConflict: 'id' })
      .select()

    if (categoryError) {
      console.error('Category creation error:', categoryError)
      throw new Error('카테고리 생성 실패')
    }

    createdIds.push(...testCategories.map(c => c.id))

    // 테스트 태그 데이터 (10개 인기 태그)
    const testTags = [
      { name: 'javascript-test', usage_count: 150 },
      { name: 'typescript-test', usage_count: 120 },
      { name: 'react-test', usage_count: 100 },
      { name: 'nextjs-test', usage_count: 90 },
      { name: 'nodejs-test', usage_count: 85 },
      { name: 'python-test', usage_count: 80 },
      { name: 'docker-test', usage_count: 75 },
      { name: 'kubernetes-test', usage_count: 70 },
      { name: 'aws-test', usage_count: 65 },
      { name: 'mongodb-test', usage_count: 60 }
    ]

    // 태그 생성
    const { data: tags, error: tagError } = await supabase
      .from('tags')
      .upsert(testTags, { onConflict: 'name' })
      .select()

    if (tagError) {
      console.error('Tag creation error:', tagError)
      throw new Error('태그 생성 실패')
    }

    return NextResponse.json({
      success: true,
      createdIds,
      summary: {
        '카테고리': categories?.length || 0,
        '태그': tags?.length || 0
      }
    })
  } catch (error) {
    console.error('Test categories data creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create test categories data' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/test-data/categories
 * 카테고리 테스트 데이터 삭제
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

    // 테스트 카테고리 ID 패턴
    const testCategoryIds = [
      'cc0e8400-e29b-41d4-a716-446655440001',
      'cc0e8400-e29b-41d4-a716-446655440002',
      'cc0e8400-e29b-41d4-a716-446655440003',
      'cc0e8400-e29b-41d4-a716-446655440004',
      'cc0e8400-e29b-41d4-a716-446655440005'
    ]

    // 테스트 태그 패턴
    const testTagPattern = '%-test'

    // 카테고리 삭제
    const { error: categoryDeleteError } = await supabase
      .from('categories')
      .delete()
      .in('id', testCategoryIds)

    if (categoryDeleteError) {
      throw categoryDeleteError
    }

    // 태그 삭제
    const { error: tagDeleteError } = await supabase
      .from('tags')
      .delete()
      .like('name', testTagPattern)

    if (tagDeleteError) {
      throw tagDeleteError
    }

    return NextResponse.json({
      success: true,
      message: '카테고리 및 태그 테스트 데이터가 삭제되었습니다'
    })
  } catch (error) {
    console.error('Test categories data deletion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete test categories data' },
      { status: 500 }
    )
  }
}