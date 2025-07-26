/**
 * 지식공유 게시판 API 라우트
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ knowledge_posts 테이블 없음! 
 * - ✅ 모든 게시글은 posts 테이블 사용
 * - 📌 board_type_id로 구분:
 *   - 지식공유: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885' (slug: 'knowledge', requires_approval: true)
 *   - 자유게시판: '00f8f32b-faca-4947-94f5-812a0bb97c39' (slug: 'forum', requires_approval: false)
 * 
 * 🔄 API 엔드포인트 매핑:
 * - /api/posts → posts 테이블 (다양한 board_type 처리 가능)
 * - /api/free-posts → posts 테이블 (board_type='forum' 전용)
 * 
 * ⚠️ 주의: 지식공유는 관리자 승인 필요 (status: draft → pending → published/rejected)
 * 자유게시판과 달리 즉시 게시되지 않음!
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { PostStatus, Post, Category, BoardType } from '@/types/post'
import type { User } from '@/types/auth'
import { rateLimit, sanitizeInput, validateUUID } from '@/lib/security'
import { postSchemas, parseJsonBody } from '@/lib/validation/schemas'
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
    const boardId = searchParams.get('boardId')
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status') as PostStatus || 'published'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
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
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          }
        }
      }
    )

    let query = supabase
      .from('posts')
      .select(`
        *,
        board_types (
          id,
          name,
          slug,
          icon,
          requires_approval
        ),
        categories (
          id,
          name,
          slug,
          color,
          icon
        )
      `)
      .eq('status', status)

    // 필터 적용 (UUID 검증)
    if (boardId) {
      if (!validateUUID(boardId)) {
        return NextResponse.json(
          { error: '유효하지 않은 게시판 ID입니다.' },
          { status: 400 }
        )
      }
      query = query.eq('board_type_id', boardId)
    }
    
    if (categoryId) {
      if (!validateUUID(categoryId)) {
        return NextResponse.json(
          { error: '유효하지 않은 카테고리 ID입니다.' },
          { status: 400 }
        )
      }
      query = query.eq('category_id', categoryId)
    }

    // 정렬 및 페이지네이션
    query = query
      .order('is_pinned', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const postsResult = await executeWithRLSHandling(
      () => query,
      {
        context: '지식공유 게시글 목록 조회',
        returnEmptyArray: true
      }
    )

    if (postsResult.error && !postsResult.isRLSError) {
      console.error('지식공유 게시글 조회 에러:', postsResult.error)
      return NextResponse.json(
        { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const posts = postsResult.data || []

    // 총 개수 조회
    let countQuery = supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)

    if (boardId) {
      countQuery = countQuery.eq('board_type_id', boardId)
    }

    if (categoryId) {
      countQuery = countQuery.eq('category_id', categoryId)
    }

    const countResult = await executeWithRLSHandling(
      () => countQuery,
      {
        context: '지식공유 게시글 개수 조회',
        fallbackData: { count: 0 }
      }
    )

    if (countResult.error && !countResult.isRLSError) {
      console.error('지식공유 게시글 개수 조회 에러:', countResult.error)
    }

    const count = countResult.data?.count || 0

    // 게시글 데이터 변환 (denormalized author fields -> author object)
    const transformedPosts = (posts || []).map(post => ({
      ...post,
      author: {
        id: post.author_id,
        username: post.author_username || 'Unknown',
        display_name: post.author_display_name,
        avatar_url: post.author_avatar_url
      },
      board_type: post.board_types || null,
      category: post.categories || null,
      // 조인된 테이블 데이터 제거
      board_types: undefined,
      categories: undefined
    }))

    return NextResponse.json({
      posts: transformedPosts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count
    })
  } catch (error) {
    console.error('게시글 조회 예외:', error)
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

    // 인증 확인
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 요청 본문 파싱 및 검증
    const validationResult = await parseJsonBody(request, postSchemas.create)
    
    if (validationResult.error) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }

    const { 
      title,
      content,
      board_type_id,
      category_id,
      tags = [],
      thumbnail_url,
      excerpt,
      status = 'published'
    } = validationResult.data!

    // 작성자 정보 가져오기 - RLS 에러 처리 포함
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

    // 게시판 타입 확인 (승인 필요 여부) - RLS 에러 처리 포함
    const boardTypeResult = await executeWithRLSHandling(
      () => supabase
        .from('board_types')
        .select('requires_approval')
        .eq('id', board_type_id)
        .single(),
      {
        context: '지식공유 board_type 조회',
        fallbackData: null
      }
    )

    if (boardTypeResult.error && !boardTypeResult.isRLSError) {
      console.error('게시판 타입 조회 에러:', boardTypeResult.error)
      return NextResponse.json(
        { error: '게시판 타입을 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    const boardType = boardTypeResult.data
    if (!boardType) {
      return NextResponse.json(
        { error: '지식공유 게시판 타입을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    let finalStatus: PostStatus = status

    // 공식게시판인 경우 자동으로 승인 대기 상태로 설정
    if (boardType?.requires_approval && status !== 'draft') {
      finalStatus = 'pending'
    }

    // 게시글 생성 (denormalized author fields 포함) - RLS 에러 처리 포함
    const postResult = await executeWithRLSHandling(
      () => supabase
        .from('posts')
        .insert({
          board_type_id,
          category_id,
          author_id: session.user.id,
          author_username: profile?.username || null,
          author_display_name: profile?.display_name || null,
          author_avatar_url: profile?.avatar_url || null,
          title: title, // 이미 검증 및 새니타이징됨
          content: content, // 이미 검증 및 새니타이징됨
          excerpt: excerpt || null, // 이미 검증 및 새니타이징됨
          tags: tags, // 이미 검증됨
          thumbnail_url: thumbnail_url || null,
          status: finalStatus,
          published_at: finalStatus === 'published' ? new Date().toISOString() : null
        })
        .select(`
          *,
          board_types (
            id,
            name,
            slug,
            icon
          ),
          categories (
            id,
            name,
            slug,
            color,
            icon
          )
        `)
        .single(),
      {
        context: '지식공유 게시글 생성',
        userId: session.user.id,
        fallbackData: null
      }
    )

    if (postResult.error && !postResult.isRLSError) {
      console.error('지식공유 게시글 생성 에러:', postResult.error)
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

    return NextResponse.json({
      success: true,
      post,
      message: finalStatus === 'pending' 
        ? '게시글이 제출되었습니다. 관리자 승인 후 게시됩니다.'
        : '게시글이 성공적으로 게시되었습니다.'
    }, { status: 201 })
  } catch (error) {
    console.error('게시글 생성 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}