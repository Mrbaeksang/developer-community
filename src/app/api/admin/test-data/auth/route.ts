import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/test-data/auth
 * 인증 및 사용자 테스트 데이터 생성
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
    
    // 테스트 사용자 데이터 (3명: 관리자 1명, 일반 사용자 2명)
    const testUsers = [
      {
        id: 'ee0e8400-e29b-41d4-a716-446655440001',
        email: 'test-admin@example.com',
        name: '테스트 관리자',
        bio: '테스트용 관리자 계정입니다.',
        website: 'https://admin.example.com',
        github_url: 'https://github.com/test-admin',
        role: 'admin',
        created_at: new Date().toISOString()
      },
      {
        id: 'ee0e8400-e29b-41d4-a716-446655440002',
        email: 'test-user1@example.com',
        name: '테스트 사용자1',
        bio: '프론트엔드 개발자입니다. React와 TypeScript를 좋아합니다.',
        website: 'https://user1.example.com',
        github_url: 'https://github.com/test-user1',
        role: 'user',
        created_at: new Date().toISOString()
      },
      {
        id: 'ee0e8400-e29b-41d4-a716-446655440003',
        email: 'test-user2@example.com',
        name: '테스트 사용자2',
        bio: '백엔드 개발자입니다. Node.js와 PostgreSQL을 주로 사용합니다.',
        website: 'https://user2.example.com',
        github_url: 'https://github.com/test-user2',
        role: 'user',
        created_at: new Date().toISOString()
      }
    ]

    // 프로필 생성 (실제 auth 사용자 생성은 불가능하므로 프로필만 생성)
    // 주의: 실제로는 Supabase Auth를 통해 사용자를 생성해야 하지만,
    // 테스트 목적으로는 profiles 테이블에만 데이터를 추가합니다.
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .upsert(testUsers, { onConflict: 'id' })
      .select()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      throw new Error('프로필 생성 실패')
    }

    createdIds.push(...testUsers.map(u => u.id))

    // 사용자 간 팔로우 관계 설정 (선택사항)
    // 필요시 follows 테이블이 있다면 추가 가능

    return NextResponse.json({
      success: true,
      createdIds,
      summary: {
        '관리자': 1,
        '일반사용자': 2,
        '총프로필': profiles?.length || 0
      },
      message: '테스트 사용자 프로필이 생성되었습니다. 실제 로그인은 Supabase Auth를 통해 별도로 생성해야 합니다.'
    })
  } catch (error) {
    console.error('Test auth data creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create test auth data' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/test-data/auth
 * 인증 테스트 데이터 삭제
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

    // 테스트 사용자 ID 패턴
    const testUserIds = [
      'ee0e8400-e29b-41d4-a716-446655440001',
      'ee0e8400-e29b-41d4-a716-446655440002',
      'ee0e8400-e29b-41d4-a716-446655440003'
    ]

    // 프로필 삭제
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .in('id', testUserIds)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: '테스트 사용자 데이터가 삭제되었습니다'
    })
  } catch (error) {
    console.error('Test auth data deletion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete test auth data' },
      { status: 500 }
    )
  }
}