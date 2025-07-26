import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, requireAdmin, sanitizeInput } from '@/lib/security'

// POST /api/admin/board-types - 게시판 타입 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => 
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          }
        }
      }
    )

    // 관리자 권한 확인
    const adminCheck = await requireAdmin(request, supabase)
    if (adminCheck) return adminCheck

    const { name, slug, description, requires_approval } = await request.json()

    // 필수 필드 검증
    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: '게시판 이름과 슬러그는 필수입니다' }, { status: 400 })
    }

    // 슬러그 형식 검증 (영문 소문자, 숫자, 하이픈만 허용)
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ 
        error: '슬러그는 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다' 
      }, { status: 400 })
    }

    // 입력 길이 제한
    if (name.length > 50) {
      return NextResponse.json({ error: '게시판 이름은 50자를 초과할 수 없습니다' }, { status: 400 })
    }

    if (slug.length > 50) {
      return NextResponse.json({ error: '슬러그는 50자를 초과할 수 없습니다' }, { status: 400 })
    }

    if (description && description.length > 200) {
      return NextResponse.json({ error: '설명은 200자를 초과할 수 없습니다' }, { status: 400 })
    }

    // Input sanitization
    const sanitizedName = sanitizeInput(name)
    const sanitizedSlug = slug.toLowerCase().trim()
    const sanitizedDescription = description ? sanitizeInput(description) : null

    // 중복 슬러그 확인
    const { data: existingBoardType } = await supabase
      .from('board_types')
      .select('id')
      .eq('slug', sanitizedSlug)
      .single()

    if (existingBoardType) {
      return NextResponse.json({ error: '이미 존재하는 슬러그입니다' }, { status: 409 })
    }

    // 게시판 타입 생성
    const { data: newBoardType, error } = await supabase
      .from('board_types')
      .insert({
        name: sanitizedName.trim(),
        slug: sanitizedSlug,
        description: sanitizedDescription?.trim() || null,
        requires_approval: requires_approval || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('게시판 타입 생성 실패:', error)
      return NextResponse.json({ error: '게시판 타입 생성에 실패했습니다' }, { status: 500 })
    }

    // 기본 카테고리 생성
    const defaultCategories = [
      { name: '일반', slug: 'general', order_index: 0 },
      { name: '질문', slug: 'question', order_index: 1 },
      { name: '정보', slug: 'info', order_index: 2 }
    ]

    const categoryInserts = defaultCategories.map(cat => ({
      board_type_id: newBoardType.id,
      name: cat.name,
      slug: cat.slug,
      order_index: cat.order_index,
      created_at: new Date().toISOString()
    }))

    const { error: categoryError } = await supabase
      .from('categories')
      .insert(categoryInserts)

    if (categoryError) {
      console.error('기본 카테고리 생성 실패:', categoryError)
      // 게시판 타입은 생성되었으므로 경고만 표시
    }

    return NextResponse.json({
      id: newBoardType.id,
      name: newBoardType.name,
      slug: newBoardType.slug,
      description: newBoardType.description,
      requires_approval: newBoardType.requires_approval,
      created_at: newBoardType.created_at,
      message: '게시판 타입이 생성되었습니다'
    }, { status: 201 })
  } catch (error) {
    console.error('게시판 타입 생성 오류:', error)
    return NextResponse.json({ error: '게시판 타입 생성에 실패했습니다' }, { status: 500 })
  }
}