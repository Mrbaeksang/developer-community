import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, validateUUID } from '@/lib/security'

interface Params {
  id: string
}

// 좋아요 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const { id } = await params

    // UUID validation
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 게시글 ID입니다.' },
        { status: 400 }
      )
    }
    
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

    // 좋아요 추가 (중복 시 무시)
    const { error } = await supabase
      .from('post_likes')
      .insert({
        post_id: id,
        user_id: session.user.id
      })

    if (error) {
      // 중복 좋아요인 경우
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '이미 좋아요를 누르셨습니다.' },
          { status: 400 }
        )
      }
      
      console.error('좋아요 추가 에러:', error)
      return NextResponse.json(
        { error: '좋아요 추가 중 오류가 발생했습니다.' },
        { status: 500 }
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

    // 업데이트된 좋아요 수 조회
    const { data: post } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', id)
      .eq('board_type_id', boardType.id)
      .single()

    return NextResponse.json({ 
      message: '좋아요가 추가되었습니다.',
      likeCount: post?.like_count || 0
    })
  } catch (error) {
    console.error('좋아요 추가 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 좋아요 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const { id } = await params

    // UUID validation
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 게시글 ID입니다.' },
        { status: 400 }
      )
    }
    
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

    // 좋아요 제거
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('좋아요 제거 에러:', error)
      return NextResponse.json(
        { error: '좋아요 제거 중 오류가 발생했습니다.' },
        { status: 500 }
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

    // 업데이트된 좋아요 수 조회
    const { data: post } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', id)
      .eq('board_type_id', boardType.id)
      .single()

    return NextResponse.json({ 
      message: '좋아요가 취소되었습니다.',
      likeCount: post?.like_count || 0
    })
  } catch (error) {
    console.error('좋아요 제거 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}