import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/types/post'
import type { CreateCategoryInput } from '@/types/admin'
import type { UserRole } from '@/types/auth'
import { rateLimit, sanitizeInput, requireAdmin } from '@/lib/security'

// GET: 관리자용 카테고리 목록 조회 (게시글 수 포함)
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const adminCheck = await requireAdmin(request, supabase)
    if (adminCheck) return adminCheck

    // 카테고리와 게시글 수 조회
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        *,
        posts(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('카테고리 조회 실패:', error)
      return NextResponse.json({ error: '카테고리를 불러오는데 실패했습니다' }, { status: 500 })
    }

    // post_count 필드 추가
    const categoriesWithCount = categories.map(category => ({
      ...category,
      post_count: category.posts?.[0]?.count || 0,
      posts: undefined // posts 필드 제거
    }))

    return NextResponse.json(categoriesWithCount)
  } catch (error) {
    console.error('카테고리 조회 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류' }, { status: 500 })
  }
}

// POST: 새 카테고리 생성
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const adminCheck = await requireAdmin(request, supabase)
    if (adminCheck) return adminCheck

    const body = await request.json()
    const { name, slug, color, description } = body

    // 유효성 검사
    if (!name?.trim()) {
      return NextResponse.json({ error: '카테고리 이름은 필수입니다' }, { status: 400 })
    }

    if (!slug?.trim()) {
      return NextResponse.json({ error: '슬러그는 필수입니다' }, { status: 400 })
    }

    if (!color?.trim()) {
      return NextResponse.json({ error: '색상은 필수입니다' }, { status: 400 })
    }

    // 슬러그 유효성 검사 (영문자, 숫자, 하이픈만 허용)
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ error: '슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다' }, { status: 400 })
    }

    // Input sanitization
    const sanitizedName = sanitizeInput(name)
    const sanitizedSlug = sanitizeInput(slug)
    const sanitizedColor = sanitizeInput(color)
    const sanitizedDescription = description ? sanitizeInput(description) : null

    // 슬러그 중복 확인
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', sanitizedSlug.trim())
      .single()

    if (existingCategory) {
      return NextResponse.json({ error: '이미 사용 중인 슬러그입니다' }, { status: 400 })
    }

    // 카테고리 생성
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: sanitizedName.trim(),
        slug: sanitizedSlug.trim(),
        color: sanitizedColor.trim(),
        description: sanitizedDescription?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('카테고리 생성 실패:', error)
      return NextResponse.json({ error: '카테고리 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('카테고리 생성 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류' }, { status: 500 })
  }
}