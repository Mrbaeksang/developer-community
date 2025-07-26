import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, requireAdmin } from '@/lib/security'

/**
 * GET /api/admin/categories/[boardId]
 * 특정 게시판의 카테고리 목록 조회 (관리자용)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 관리자 권한 확인
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) return adminCheck

    const { boardId } = params
    const supabase = await createClient()

    // 게시판 타입 확인
    const { data: boardType, error: boardError } = await supabase
      .from('board_types')
      .select('id, name, slug')
      .eq('id', boardId)
      .single()

    if (boardError || !boardType) {
      return NextResponse.json(
        { error: 'Board type not found' },
        { status: 404 }
      )
    }

    // 해당 게시판의 카테고리 조회
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('board_type_id', boardId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Get categories error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      )
    }

    // 각 카테고리의 게시글 수 조회
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('status', 'published')

        return {
          ...category,
          post_count: count || 0
        }
      })
    )

    return NextResponse.json({
      board_type: boardType,
      categories: categoriesWithCount,
      total: categoriesWithCount.length
    })
  } catch (error) {
    console.error('Get board categories exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}