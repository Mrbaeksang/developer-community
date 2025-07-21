import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT: 카테고리 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, color, description } = body
    const { id } = await params
    const categoryId = id

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

    // 카테고리 존재 확인
    const { data: existingCategory } = await supabase
      .from('post_categories')
      .select('id')
      .eq('id', categoryId)
      .single()

    if (!existingCategory) {
      return NextResponse.json({ error: '카테고리를 찾을 수 없습니다' }, { status: 404 })
    }

    // 슬러그 중복 확인 (자기 자신 제외)
    const { data: duplicateCategory } = await supabase
      .from('post_categories')
      .select('id')
      .eq('slug', slug.trim())
      .neq('id', categoryId)
      .single()

    if (duplicateCategory) {
      return NextResponse.json({ error: '이미 사용 중인 슬러그입니다' }, { status: 400 })
    }

    // 카테고리 수정
    const { data: category, error } = await supabase
      .from('post_categories')
      .update({
        name: name.trim(),
        slug: slug.trim(),
        color: color.trim(),
        description: description?.trim() || null,
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
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
    }

    const { id } = await params
    const categoryId = id

    // 카테고리 존재 확인
    const { data: existingCategory } = await supabase
      .from('post_categories')
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
      .from('post_categories')
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