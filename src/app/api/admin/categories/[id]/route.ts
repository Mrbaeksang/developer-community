import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, validateUUID, sanitizeInput, requireAdmin } from '@/lib/security'

// PUT: 카테고리 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const categoryId = id

    // UUID validation
    if (!validateUUID(categoryId)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리 ID입니다.' },
        { status: 400 }
      )
    }

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

    // 카테고리 존재 확인
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .single()

    if (!existingCategory) {
      return NextResponse.json({ error: '카테고리를 찾을 수 없습니다' }, { status: 404 })
    }

    // 슬러그 중복 확인 (자기 자신 제외)
    const { data: duplicateCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', sanitizedSlug.trim())
      .neq('id', categoryId)
      .single()

    if (duplicateCategory) {
      return NextResponse.json({ error: '이미 사용 중인 슬러그입니다' }, { status: 400 })
    }

    // 카테고리 수정
    const { data: category, error } = await supabase
      .from('categories')
      .update({
        name: sanitizedName.trim(),
        slug: sanitizedSlug.trim(),
        color: sanitizedColor.trim(),
        description: sanitizedDescription?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select()
      .single()

    if (error) {
      console.error('카테고리 수정 실패:', error)
      return NextResponse.json({ error: '카테고리 수정에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('카테고리 수정 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류' }, { status: 500 })
  }
}

// DELETE: 카테고리 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const adminCheck = await requireAdmin(request, supabase)
    if (adminCheck) return adminCheck

    const { id } = await params
    const categoryId = id

    // UUID validation
    if (!validateUUID(categoryId)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리 ID입니다.' },
        { status: 400 }
      )
    }

    // 카테고리 존재 확인
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', categoryId)
      .single()

    if (!existingCategory) {
      return NextResponse.json({ error: '카테고리를 찾을 수 없습니다' }, { status: 404 })
    }

    // 카테고리를 사용하는 게시글이 있는지 확인
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1)

    if (postsError) {
      console.error('게시글 확인 실패:', postsError)
      return NextResponse.json({ error: '게시글 확인에 실패했습니다' }, { status: 500 })
    }

    if (posts && posts.length > 0) {
      return NextResponse.json({ 
        error: '이 카테고리를 사용하는 게시글이 있어 삭제할 수 없습니다' 
      }, { status: 400 })
    }

    // 카테고리 삭제
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('카테고리 삭제 실패:', error)
      return NextResponse.json({ error: '카테고리 삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ message: '카테고리가 삭제되었습니다' })
  } catch (error) {
    console.error('카테고리 삭제 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류' }, { status: 500 })
  }
}