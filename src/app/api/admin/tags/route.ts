import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, requireAdmin, sanitizeInput } from '@/lib/security'

// POST /api/admin/tags - 태그 생성 (관리자 전용)
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

    const body = await request.json()
    const { name, description, category, color } = body

    // 필수 필드 검증
    if (!name?.trim()) {
      return NextResponse.json({ error: '태그 이름은 필수입니다' }, { status: 400 })
    }

    // 태그 이름 형식 검증 (한글, 영문, 숫자, 하이픈, 언더스코어만 허용)
    const tagRegex = /^[가-힣a-zA-Z0-9-_]+$/
    if (!tagRegex.test(name)) {
      return NextResponse.json({ 
        error: '태그 이름은 한글, 영문, 숫자, 하이픈(-), 언더스코어(_)만 사용할 수 있습니다' 
      }, { status: 400 })
    }

    // 입력 길이 제한
    if (name.length > 30) {
      return NextResponse.json({ error: '태그 이름은 30자를 초과할 수 없습니다' }, { status: 400 })
    }

    if (description && description.length > 100) {
      return NextResponse.json({ error: '설명은 100자를 초과할 수 없습니다' }, { status: 400 })
    }

    if (category && category.length > 50) {
      return NextResponse.json({ error: '카테고리는 50자를 초과할 수 없습니다' }, { status: 400 })
    }

    // 색상 형식 검증 (hex color)
    if (color) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/
      if (!colorRegex.test(color)) {
        return NextResponse.json({ 
          error: '색상은 hex 형식이어야 합니다 (예: #FF5733)' 
        }, { status: 400 })
      }
    }

    // Input sanitization
    const sanitizedName = sanitizeInput(name).toLowerCase()
    const sanitizedDescription = description ? sanitizeInput(description) : null
    const sanitizedCategory = category ? sanitizeInput(category) : null

    // 중복 태그 확인
    const { data: existingTag } = await supabase
      .from('tags')
      .select('id')
      .eq('name', sanitizedName)
      .single()

    if (existingTag) {
      return NextResponse.json({ error: '이미 존재하는 태그입니다' }, { status: 409 })
    }

    // 태그 생성
    const { data: newTag, error } = await supabase
      .from('tags')
      .insert({
        name: sanitizedName.trim(),
        description: sanitizedDescription?.trim() || null,
        category: sanitizedCategory?.trim() || null,
        color: color || '#6B7280', // 기본 색상 (gray-500)
        use_count: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('태그 생성 실패:', error)
      return NextResponse.json({ error: '태그 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      id: newTag.id,
      name: newTag.name,
      description: newTag.description,
      category: newTag.category,
      color: newTag.color,
      use_count: newTag.use_count,
      created_at: newTag.created_at,
      message: '태그가 생성되었습니다'
    }, { status: 201 })
  } catch (error) {
    console.error('태그 생성 오류:', error)
    return NextResponse.json({ error: '태그 생성에 실패했습니다' }, { status: 500 })
  }
}