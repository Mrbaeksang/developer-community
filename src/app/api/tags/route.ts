import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'
import { 
  executeWithRLSHandling,
  handleRLSError 
} from '@/lib/supabase/rls-error-handler'

/**
 * GET /api/tags
 * 태그 목록 조회
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sort = searchParams.get('sort') || 'usage_count' // usage_count, name, created_at
    const order = searchParams.get('order') || 'desc'

    // 태그 조회
    let query = supabase
      .from('tags')
      .select('*')

    // 검색어가 있는 경우
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 정렬 및 페이지네이션
    query = query
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1)

    const tagsResult = await executeWithRLSHandling(
      () => query,
      {
        context: '태그 목록 조회',
        returnEmptyArray: true
      }
    )

    if (tagsResult.error && !tagsResult.isRLSError) {
      console.error('태그 조회 에러:', tagsResult.error)
      return NextResponse.json(
        { error: '태그를 불러오는데 실패했습니다' },
        { status: 500 }
      )
    }

    const tags = tagsResult.data || []

    // 전체 태그 수 조회
    let countQuery = supabase
      .from('tags')
      .select('id', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const countResult = await executeWithRLSHandling(
      () => countQuery,
      {
        context: '태그 개수 조회',
        fallbackData: { count: 0 }
      }
    )

    if (countResult.error && !countResult.isRLSError) {
      console.error('태그 개수 조회 에러:', countResult.error)
    }

    const count = countResult.data?.count || 0

    return NextResponse.json({
      tags: tags || [],
      total: count || 0,
      has_more: offset + limit < (count || 0),
    })
  } catch (error) {
    console.error('Get tags exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}