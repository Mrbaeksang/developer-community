/**
 * 자유게시판 개별 게시글 API
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts 테이블 없음!
 * - ✅ posts 테이블에서 board_type_id='00f8f32b-...' 필터링
 * - 📌 'free' slug는 잘못됨! 'forum' slug 사용해야 함
 * 
 * ⚠️ 주의: 이 파일의 38-43라인에 버그 있음!
 * .eq('slug', 'free') → .eq('slug', 'forum') 이어야 함
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    
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

    // 'free' slug로 board_type_id 조회
    const { data: boardType, error: boardTypeError } = await supabase
      .from('board_types')
      .select('id')
      .eq('slug', 'free')
      .single()

    if (boardTypeError || !boardType) {
      console.error('자유게시판 타입 조회 에러:', boardTypeError)
      return NextResponse.json(
        { error: '게시판 타입을 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    // 조회수 증가
    await supabase.rpc('increment_view_count', { post_id: id })

    // 게시글 상세 조회
    const { data: post, error } = await supabase
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
      .eq('id', id)
      .eq('board_type_id', boardType.id)
      .eq('status', 'published')
      .single()

    if (error) {
      console.error('자유게시판 게시글 조회 에러:', error)
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 카테고리 정보 조회
    let categorySlug = 'chat' // 기본값
    if (post.category_id) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('slug')
        .eq('id', post.category_id)
        .single()
      
      if (categoryData) {
        categorySlug = categoryData.slug
      }
    }

    // 작성자 정보는 이미 denormalized 되어있으므로 그대로 사용
    const postWithProfile = {
      ...post,
      category: categorySlug, // 카테고리 슬러그 추가
      profiles: {
        id: post.author_id,
        username: post.author_username || 'Unknown',
        display_name: post.author_display_name || 'Unknown',
        avatar_url: post.author_avatar_url || null,
        bio: null // bio는 denormalized 되지 않음
      }
    }

    // 댓글 조회
    const { data: comments, error: commentsError } = await supabase
      .from('post_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        author_id,
        parent_id
      `)
      .eq('post_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('댓글 조회 에러:', commentsError)
    }

    // 댓글 작성자 프로필 조회
    const commentAuthorIds = [...new Set(comments?.map(c => c.author_id) || [])]
    const { data: commentProfiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', commentAuthorIds)

    const commentProfileMap = new Map(commentProfiles?.map(p => [p.id, p]) || [])
    const commentsWithProfiles = comments?.map(comment => ({
      ...comment,
      profiles: commentProfileMap.get(comment.author_id) || {
        id: comment.author_id,
        username: 'Unknown',
        display_name: 'Unknown',
        avatar_url: null
      }
    })) || []

    // 현재 사용자의 좋아요 여부 확인
    let userLiked = false
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', id)
        .eq('user_id', session.user.id)
        .single()
      
      userLiked = !!likeData
    }

    return NextResponse.json({
      post: postWithProfile,
      comments: commentsWithProfiles,
      userLiked
    })
  } catch (error) {
    console.error('자유게시판 게시글 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    
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

    // 'free' slug로 board_type_id 조회
    const { data: boardType, error: boardTypeError } = await supabase
      .from('board_types')
      .select('id')
      .eq('slug', 'free')
      .single()

    if (boardTypeError || !boardType) {
      console.error('자유게시판 타입 조회 에러:', boardTypeError)
      return NextResponse.json(
        { error: '게시판 타입을 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    // 게시글 수정 (작성자만 가능)
    const { data: post, error } = await supabase
      .from('posts')
      .update({
        title: title.trim(),
        content: content.trim(),
        category_id,
        tags: tags || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('board_type_id', boardType.id)
      .eq('author_id', session.user.id) // 작성자 확인
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
      .single()

    if (error) {
      console.error('자유게시판 게시글 수정 에러:', error)
      return NextResponse.json(
        { error: '게시글 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없거나 수정 권한이 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('자유게시판 게시글 수정 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params
    
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

    // 'free' slug로 board_type_id 조회
    const { data: boardType, error: boardTypeError } = await supabase
      .from('board_types')
      .select('id')
      .eq('slug', 'free')
      .single()

    if (boardTypeError || !boardType) {
      console.error('자유게시판 타입 조회 에러:', boardTypeError)
      return NextResponse.json(
        { error: '게시판 타입을 찾을 수 없습니다.' },
        { status: 500 }
      )
    }

    // 게시글 삭제 (작성자만 가능)
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('board_type_id', boardType.id)
      .eq('author_id', session.user.id) // 작성자 확인

    if (error) {
      console.error('자유게시판 게시글 삭제 에러:', error)
      return NextResponse.json(
        { error: '게시글 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '게시글이 삭제되었습니다.' })
  } catch (error) {
    console.error('자유게시판 게시글 삭제 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}