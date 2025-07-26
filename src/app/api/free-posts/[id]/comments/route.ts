import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Params {
  id: string
}

// 댓글 목록 조회
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

    // 해당 게시글이 자유게시판 게시글인지 확인
    const { data: post } = await supabase
      .from('posts')
      .select('id')
      .eq('id', id)
      .eq('board_type_id', boardType.id)
      .single()

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const { data: comments, error } = await supabase
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

    if (error) {
      console.error('댓글 조회 에러:', error)
      return NextResponse.json(
        { error: '댓글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 프로필 정보 별도 조회
    const authorIds = [...new Set(comments?.map(c => c.author_id) || [])]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', authorIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    // 댓글에 프로필 정보 추가
    const commentsWithProfiles = comments?.map(comment => ({
      ...comment,
      profiles: profileMap.get(comment.author_id) || {
        id: comment.author_id,
        username: 'Unknown',
        display_name: 'Unknown',
        avatar_url: null
      }
    })) || []

    return NextResponse.json({ comments: commentsWithProfiles })
  } catch (error) {
    console.error('댓글 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 댓글 작성
export async function POST(
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
    const { content, parent_id } = body

    // 필수 필드 검증
    if (!content?.trim()) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요.' },
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

    // 해당 게시글이 자유게시판 게시글인지 확인
    const { data: post } = await supabase
      .from('posts')
      .select('id')
      .eq('id', id)
      .eq('board_type_id', boardType.id)
      .single()

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 댓글 생성
    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: id,
        author_id: session.user.id,
        content: content.trim(),
        parent_id: parent_id || null
      })
      .select(`
        id,
        content,
        created_at,
        updated_at,
        author_id,
        parent_id
      `)
      .single()

    if (error) {
      console.error('댓글 작성 에러:', error)
      return NextResponse.json(
        { error: '댓글 작성 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 프로필 정보 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single()

    const commentWithProfile = {
      ...comment,
      profiles: profile || {
        id: session.user.id,
        username: 'Unknown',
        display_name: 'Unknown',
        avatar_url: null
      }
    }

    return NextResponse.json({ comment: commentWithProfile }, { status: 201 })
  } catch (error) {
    console.error('댓글 작성 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}