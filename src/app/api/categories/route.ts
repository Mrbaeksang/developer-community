import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, sanitizeInput, requireAdmin } from '@/lib/security'
import { 
  executeWithRLSHandling,
  handleRLSError 
} from '@/lib/supabase/rls-error-handler'

export async function GET(request: NextRequest) {
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
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    )

    // 모든 카테고리 조회 (board_types 정보 포함) - RLS 에러 처리 포함
    const categoriesResult = await executeWithRLSHandling(
      () => supabase
        .from('categories')
        .select(`
          *,
          board_types(*)
        `)
        .eq('is_active', true)
        .order('board_type_id')
        .order('order_index'),
      {
        context: '카테고리 목록 조회',
        returnEmptyArray: true
      }
    )

    if (categoriesResult.error && !categoriesResult.isRLSError) {
      console.error('카테고리 조회 에러:', categoriesResult.error)
      return NextResponse.json(
        { error: '카테고리를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const categories = categoriesResult.data || []

    return NextResponse.json(categories)
  } catch (error) {
    console.error('카테고리 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

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
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    )

    // 관리자 권한 확인
    const adminCheck = await requireAdmin(request, supabase)
    if (adminCheck) return adminCheck

    const body = await request.json()
    const { name, description, board_type_id } = body

    // 필수 필드 검증
    if (!name) {
      return NextResponse.json(
        { error: '카테고리 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    // Input sanitization
    const sanitizedName = sanitizeInput(name)
    const sanitizedDescription = description ? sanitizeInput(description) : null

    // slug 생성 (한글을 영문으로 변환하는 간단한 로직)
    const slug = sanitizedName
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // 카테고리 생성 - RLS 에러 처리 포함
    const categoryResult = await executeWithRLSHandling(
      () => supabase
        .from('categories')
        .insert({
          name: sanitizedName,
          slug,
          description: sanitizedDescription,
          board_type_id: board_type_id // board_type_id is required for categories
        })
        .select('*')
        .single(),
      {
        context: '카테고리 생성',
        fallbackData: null
      }
    )

    if (categoryResult.error && !categoryResult.isRLSError) {
      const error = categoryResult.error
      if (error.code === '23505') { // unique constraint violation
        return NextResponse.json(
          { error: '이미 존재하는 카테고리입니다.' },
          { status: 409 }
        )
      }
      console.error('카테고리 생성 에러:', error)
      return NextResponse.json(
        { error: '카테고리 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const category = categoryResult.data
    if (!category) {
      return NextResponse.json(
        { error: '카테고리 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('카테고리 생성 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}