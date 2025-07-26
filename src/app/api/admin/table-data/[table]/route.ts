import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  checkUserAuthentication, 
  checkAdminPermission, 
  executeWithRLSHandling,
  handleRLSError 
} from '@/lib/supabase/rls-error-handler'

/**
 * GET /api/admin/table-data/[table]
 * 특정 테이블의 실제 데이터 조회 (관리자 전용)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    
    // 사용자 인증 확인 (RLS 에러 처리 포함)
    const authResult = await checkUserAuthentication(supabase)
    if (authResult.error) {
      return authResult.error
    }
    const user = authResult.user

    // 관리자 권한 확인 (RLS 에러 처리 포함)
    const adminResult = await checkAdminPermission(supabase, user.id)
    if (adminResult.error) {
      return adminResult.error
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const orderBy = searchParams.get('orderBy') || 'created_at'
    const order = searchParams.get('order') || 'desc'

    // 허용된 테이블 목록
    const allowedTables = [
      'profiles',
      'board_types',
      'categories',
      'posts',
      'post_comments',
      'post_likes',
      'communities',
      'community_members',
      'community_messages',
      'community_memos',
      'community_files',
      'tags',
      'messages',
      'notifications',
      'user_activities'
    ]

    if (!allowedTables.includes(resolvedParams.table)) {
      return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
    }

    // 전체 카운트 조회 (RLS 에러 처리 포함)
    const countResult = await executeWithRLSHandling(
      () => supabase
        .from(resolvedParams.table)
        .select('*', { count: 'exact', head: true }),
      {
        context: `테이블 ${resolvedParams.table} 카운트 조회`,
        userId: user.id,
        fallbackData: { count: 0 }
      }
    )

    if (countResult.error && !countResult.isRLSError) {
      console.error('Count error:', countResult.error)
      return NextResponse.json({ 
        error: 'Failed to count records',
        details: countResult.error.message 
      }, { status: 500 })
    }

    const totalCount = countResult.data?.count || 0

    // 데이터 조회 (RLS 에러 처리 포함)
    let query = supabase.from(resolvedParams.table).select('*')

    // 정렬 적용 (created_at 컬럼이 있는 경우에만)
    const columnsResult = await executeWithRLSHandling(
      () => supabase
        .from(resolvedParams.table)
        .select('*')
        .limit(1),
      {
        context: `테이블 ${resolvedParams.table} 컬럼 확인`,
        userId: user.id,
        fallbackData: []
      }
    )

    if (columnsResult.data && columnsResult.data.length > 0) {
      const sampleRow = columnsResult.data[0]
      if (orderBy in sampleRow) {
        query = query.order(orderBy, { ascending: order === 'asc' })
      }
    }

    // 페이징 적용
    query = query.range(offset, offset + limit - 1)

    const dataResult = await executeWithRLSHandling(
      () => query,
      {
        context: `테이블 ${resolvedParams.table} 데이터 조회`,
        userId: user.id,
        returnEmptyArray: true
      }
    )

    if (dataResult.error && !dataResult.isRLSError) {
      console.error('Query error:', dataResult.error)
      return NextResponse.json({ 
        error: 'Failed to fetch data',
        details: dataResult.error.message 
      }, { status: 500 })
    }

    const data = dataResult.data || []

    return NextResponse.json({
      data,
      total: totalCount,
      limit,
      offset,
      table: resolvedParams.table
    })
  } catch (error) {
    console.error('Table data error:', error)
    return handleRLSError(error, {
      context: '테이블 데이터 조회',
      customMessage: 'Failed to fetch table data',
      returnEmptyArray: true
    })
  }
}