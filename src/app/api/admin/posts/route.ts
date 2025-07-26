import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, sanitizeInput, requireAdmin } from '@/lib/security'
import { 
  executeWithRLSHandling,
  handleRLSError 
} from '@/lib/supabase/rls-error-handler'

// GET: 관리자용 게시글 목록 조회 (필터링 지원)
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const adminCheck = await requireAdmin(request, supabase)
    if (adminCheck) return adminCheck

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100) // Max 100

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
        author_id,
        author_username,
        author_display_name,
        author_avatar_url,
        categories (
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

    // 검색 필터 (sanitized)
    if (search) {
      const sanitizedSearch = sanitizeInput(search)
      const searchPattern = `%${sanitizedSearch.replace(/[%_]/g, '\\$&')}%`
      query = query.or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
    }

    // 페이지네이션 및 정렬
    const from = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    // RLS 에러 처리 포함한 게시글 조회
    const postsResult = await executeWithRLSHandling(
      () => query,
      {
        context: '관리자 게시글 목록 조회',
        returnEmptyArray: true
      }
    )

    if (postsResult.error && !postsResult.isRLSError) {
      console.error('관리자 게시글 조회 에러:', postsResult.error)
      return NextResponse.json({ error: '게시글을 불러오는데 실패했습니다' }, { status: 500 })
    }

    const posts = postsResult.data || []

    // 게시글 데이터 정리 (denormalized author fields 사용)
    const processedPosts = posts?.map(post => {
      return {
        ...post,
        author: {
          id: post.author_id,
          username: post.author_username || 'Unknown',
          display_name: post.author_display_name || post.author_username || 'Unknown',
          email: '', // 이메일은 보안상 제거
          avatar_url: post.author_avatar_url || null
        }
      };
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