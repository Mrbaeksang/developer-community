import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: 관리자용 게시글 목록 조회 (필터링 지원)
export async function GET(request: NextRequest) {
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

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // 쿼리 빌드
    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        excerpt,
        content,
        status,
        tags,
        created_at,
        updated_at,
        profiles:author_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        category:category_id (
          id,
          name,
          slug,
          color
        )
      `)

    // 상태 필터
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // 카테고리 필터
    if (category && category !== 'all') {
      query = query.eq('category_id', category)
    }

    // 검색 필터
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // 페이지네이션 및 정렬
    const from = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    const { data: posts, error } = await query

    if (error) {
      console.error('게시글 조회 실패:', error)
      return NextResponse.json({ error: '게시글을 불러오는데 실패했습니다' }, { status: 500 })
    }

    // 게시글 데이터 정리 (author 정보 포함)
    const processedPosts = posts?.map(post => {
      const postWithProfiles = post as typeof post & {
        profiles?: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
        }
      }
      
      return {
        ...post,
        author: {
          id: postWithProfiles.profiles?.id || '',
          username: postWithProfiles.profiles?.username || '',
          display_name: postWithProfiles.profiles?.display_name || '',
          email: '', // 이메일은 보안상 제거하거나 별도 조회 필요
          avatar_url: postWithProfiles.profiles?.avatar_url || null
        }
      }
    }) || []

    return NextResponse.json({ 
      posts: processedPosts,
      pagination: {
        page,
        limit,
        total: posts?.length || 0
      }
    })
  } catch (error) {
    console.error('게시글 조회 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류' }, { status: 500 })
  }
}