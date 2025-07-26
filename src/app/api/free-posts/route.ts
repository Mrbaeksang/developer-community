/**
 * 자유게시판 API 라우트
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts 테이블 없음! 이름에 속지 마세요!
 * - ✅ 모든 게시글은 posts 테이블 사용
 * - 📌 board_type_id로 구분:
 *   - 자유게시판: '00f8f32b-faca-4947-94f5-812a0bb97c39' (slug: 'forum', requires_approval: false)
 *   - 지식공유: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885' (slug: 'knowledge', requires_approval: true)
 * 
 * 🔄 API 엔드포인트 매핑:
 * - /api/free-posts → posts 테이블 (board_type='forum')
 * - /api/posts → posts 테이블 (board_type='knowledge')
 * 
 * ⚠️ 주의: API 경로명(/free-posts)과 실제 테이블명(posts)이 다름!
 * 자유게시판은 승인 없이 즉시 게시(status='published')
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, sanitizeInput, validateUUID } from '@/lib/security'
import { 
  executeWithRLSHandling,
  handleRLSError 
} from '@/lib/supabase/rls-error-handler'

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100
    const sortBy = searchParams.get('sortBy') || 'created_at' // created_at, like_count, view_count
    const search = searchParams.get('search')
    const offset = (page - 1) * limit

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
              // Server Component에서 호출된 경우 무시
            }
          }
        }
      }
    )

    // 'forum' slug로 board_type_id 조회 (자유게시판) - RLS 에러 처리 포함
    const boardTypeResult = await executeWithRLSHandling(
      () => supabase
        .from('board_types')
        .select('id')
        .eq('slug', 'forum')
        .single(),
      {
        context: '자유게시판 board_type 조회',
        fallbackData: null
      }
    )

    if (boardTypeResult.error && !boardTypeResult.isRLSError) {
      console.error('자유게시판 타입 조회 에러:', boardTypeResult.error)
      return NextResponse.json(
        { error: '게시판 타입을 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    const boardType = boardTypeResult.data
    if (!boardType) {
      return NextResponse.json(
        { error: '자유게시판 타입을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        category_id,
        tags,
        view_count,
        like_count,
        comment_count,
        is_pinned,
        created_at,
        updated_at,
        author_id,
        author_username,
        author_display_name,
        author_avatar_url
      `)
      .eq('board_type_id', boardType.id)
      .eq('status', 'published')

    // 카테고리 필터
    if (category && category !== 'all') {
      // 슬러그로 카테고리 ID 조회
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single()
      
      if (categoryData) {
        query = query.eq('category_id', categoryData.id)
      }
    }

    // 검색 필터 (sanitized)
    if (search) {
      const sanitizedSearch = sanitizeInput(search)
      const searchPattern = `%${sanitizedSearch.replace(/[%_]/g, '\\$&')}%`
      query = query.or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
    }

    // 정렬 순서
    const orderConfig = {
      created_at: { column: 'created_at', ascending: false },
      like_count: { column: 'like_count', ascending: false },
      view_count: { column: 'view_count', ascending: false },
      comment_count: { column: 'comment_count', ascending: false }
    }

    const { column, ascending } = orderConfig[sortBy as keyof typeof orderConfig] || orderConfig.created_at
    
    // 고정글을 먼저 정렬하고, 그 다음 선택된 기준으로 정렬
    query = query
      .order('is_pinned', { ascending: false })
      .order(column, { ascending })
      .range(offset, offset + limit - 1)

    const postsResult = await executeWithRLSHandling(
      () => query,
      {
        context: '자유게시판 게시글 목록 조회',
        returnEmptyArray: true
      }
    )

    if (postsResult.error && !postsResult.isRLSError) {
      console.error('자유게시판 조회 에러:', postsResult.error)
      return NextResponse.json(
        { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const posts = postsResult.data || []

    // 카테고리 정보 조회 - RLS 에러 처리 포함
    const categoryIds = [...new Set(posts?.map(p => p.category_id).filter(Boolean) || [])]
    const categoriesResult = await executeWithRLSHandling(
      () => supabase
        .from('categories')
        .select('id, slug')
        .in('id', categoryIds),
      {
        context: '자유게시판 카테고리 정보 조회',
        returnEmptyArray: true
      }
    )
    
    const categories = categoriesResult.data || []
    
    const categoryMap = new Map(categories?.map(c => [c.id, c.slug]) || [])

    // 작성자 정보는 이미 denormalized 되어있으므로 그대로 사용
    const postsWithProfiles = posts?.map(post => ({
      ...post,
      category: categoryMap.get(post.category_id) || 'chat', // 카테고리 슬러그 추가
      profiles: {
        id: post.author_id,
        username: post.author_username || 'Unknown',
        display_name: post.author_display_name || 'Unknown',
        avatar_url: post.author_avatar_url || null
      }
    })) || []

    // 총 개수 조회
    let countQuery = supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('board_type_id', boardType.id)
      .eq('status', 'published')

    if (category && category !== 'all') {
      // 슬러그로 카테고리 ID 조회 (위에서 조회한 것 재사용)
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single()
      
      if (categoryData) {
        countQuery = countQuery.eq('category_id', categoryData.id)
      }
    }

    if (search) {
      const sanitizedSearch = sanitizeInput(search)
      const searchPattern = `%${sanitizedSearch.replace(/[%_]/g, '\\$&')}%`
      countQuery = countQuery.or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
    }

    const countResult = await executeWithRLSHandling(
      () => countQuery,
      {
        context: '자유게시판 게시글 개수 조회',
        fallbackData: { count: 0 }
      }
    )

    if (countResult.error && !countResult.isRLSError) {
      console.error('자유게시판 개수 조회 에러:', countResult.error)
    }

    const count = countResult.data?.count || 0

    return NextResponse.json({
      posts: postsWithProfiles,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('자유게시판 조회 예외:', error)
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
              // Server Component에서 호출된 경우 무시
            }
          }
        }
      }
    )

    // 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, content, category_id, tags } = body

    // 필수 필드 검증
    if (!title?.trim() || !content?.trim() || !category_id) {
      return NextResponse.json(
        { error: '제목, 내용, 카테고리는 필수입니다.' },
        { status: 400 }
      )
    }

    // UUID validation
    if (!validateUUID(category_id)) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리 ID입니다.' },
        { status: 400 }
      )
    }

    // Input sanitization
    const sanitizedTitle = sanitizeInput(title)
    const sanitizedContent = sanitizeInput(content)

    // 'forum' slug로 board_type_id 조회 (자유게시판) - RLS 에러 처리 포함
    const boardTypeResult = await executeWithRLSHandling(
      () => supabase
        .from('board_types')
        .select('id')
        .eq('slug', 'forum')
        .single(),
      {
        context: '자유게시판 board_type 조회 (POST)',
        fallbackData: null
      }
    )

    if (boardTypeResult.error && !boardTypeResult.isRLSError) {
      console.error('자유게시판 타입 조회 에러:', boardTypeResult.error)
      return NextResponse.json(
        { error: '게시판 타입을 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    const boardType = boardTypeResult.data
    if (!boardType) {
      return NextResponse.json(
        { error: '자유게시판 타입을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 자유게시판 카테고리 검증 - 해당 board_type의 카테고리인지 확인 - RLS 에러 처리 포함
    const categoryResult = await executeWithRLSHandling(
      () => supabase
        .from('categories')
        .select('id')
        .eq('id', category_id)
        .eq('board_type_id', boardType.id)
        .single(),
      {
        context: '자유게시판 카테고리 검증',
        fallbackData: null
      }
    )

    if (categoryResult.error && !categoryResult.isRLSError) {
      console.error('카테고리 검증 에러:', categoryResult.error)
      return NextResponse.json(
        { error: '카테고리 검증 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const categoryCheck = categoryResult.data
    if (!categoryCheck) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리입니다.' },
        { status: 400 }
      )
    }

    // 작성자 프로필 정보 조회 (denormalization을 위해) - RLS 에러 처리 포함
    const profileResult = await executeWithRLSHandling(
      () => supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', session.user.id)
        .single(),
      {
        context: '작성자 프로필 정보 조회',
        userId: session.user.id,
        fallbackData: null
      }
    )

    // 프로필 조회 실패 시에도 기본값으로 진행 (RLS 에러는 무시)
    const profile = profileResult.data

    // 자유게시판 게시글 생성 (즉시 게시) - RLS 에러 처리 포함
    const postResult = await executeWithRLSHandling(
      () => supabase
        .from('posts')
        .insert({
          title: sanitizedTitle.trim(),
          content: sanitizedContent.trim(),
          category_id,
          board_type_id: boardType.id,
          tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
          author_id: session.user.id,
          author_username: profile?.username || 'Unknown',
          author_display_name: profile?.display_name || 'Unknown',
          author_avatar_url: profile?.avatar_url || null,
          status: 'published' // 자유게시판은 즉시 게시
        })
        .select(`
          id,
          title,
          content,
          category_id,
          tags,
          view_count,
          like_count,
          comment_count,
          is_pinned,
          created_at,
          updated_at,
          author_id,
          author_username,
          author_display_name,
          author_avatar_url
        `)
        .single(),
      {
        context: '자유게시판 게시글 생성',
        userId: session.user.id,
        fallbackData: null
      }
    )

    if (postResult.error && !postResult.isRLSError) {
      console.error('자유게시판 게시글 생성 에러:', postResult.error)
      return NextResponse.json(
        { error: '게시글 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const post = postResult.data
    if (!post) {
      return NextResponse.json(
        { error: '게시글 생성에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 작성자 정보는 이미 denormalized 되어있으므로 그대로 사용
    const postWithProfile = {
      ...post,
      profiles: {
        id: post.author_id,
        username: post.author_username || 'Unknown',
        display_name: post.author_display_name || 'Unknown',
        avatar_url: post.author_avatar_url || null
      }
    }

    return NextResponse.json({ post: postWithProfile }, { status: 201 })
  } catch (error) {
    console.error('자유게시판 게시글 생성 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}