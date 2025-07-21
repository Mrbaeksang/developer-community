import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Params {
  id: string
}

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

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, status')
      .eq('id', id)
      .single()

    if (postError) {
      if (postError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('게시글 조회 에러:', postError)
      return NextResponse.json(
        { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 승인된 게시글만 좋아요 가능
    if (post.status !== 'approved') {
      return NextResponse.json(
        { error: '승인된 게시글만 좋아요가 가능합니다.' },
        { status: 403 }
      )
    }

    // 기존 좋아요 확인
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', session.user.id)
      .single()

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error('좋아요 확인 에러:', likeCheckError)
      return NextResponse.json(
        { error: '좋아요 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    if (existingLike) {
      return NextResponse.json(
        { error: '이미 좋아요를 누른 게시글입니다.' },
        { status: 409 }
      )
    }

    // 좋아요 추가
    const { error: insertError } = await supabase
      .from('post_likes')
      .insert({
        post_id: id,
        user_id: session.user.id
      })

    if (insertError) {
      console.error('좋아요 추가 에러:', insertError)
      return NextResponse.json(
        { error: '좋아요 추가 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 현재 좋아요 수 조회
    const { data: currentPost } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', id)
      .single()

    // 게시글의 좋아요 수 업데이트
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({ 
        like_count: (currentPost?.like_count || 0) + 1
      })
      .eq('id', id)
      .select('like_count')
      .single()

    if (updateError) {
      console.error('좋아요 수 업데이트 에러:', updateError)
    }

    return NextResponse.json({ 
      message: '좋아요가 추가되었습니다.',
      like_count: updatedPost?.like_count
    })
  } catch (error) {
    console.error('좋아요 추가 예외:', error)
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

    // 기존 좋아요 확인
    const { error: likeCheckError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', session.user.id)
      .single()

    if (likeCheckError) {
      if (likeCheckError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '좋아요를 누르지 않은 게시글입니다.' },
          { status: 404 }
        )
      }
      console.error('좋아요 확인 에러:', likeCheckError)
      return NextResponse.json(
        { error: '좋아요 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 좋아요 삭제
    const { error: deleteError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', id)
      .eq('user_id', session.user.id)

    if (deleteError) {
      console.error('좋아요 삭제 에러:', deleteError)
      return NextResponse.json(
        { error: '좋아요 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 현재 좋아요 수 조회
    const { data: currentPost } = await supabase
      .from('posts')
      .select('like_count')
      .eq('id', id)
      .single()

    // 게시글의 좋아요 수 업데이트 (최소 0으로 제한)
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({ 
        like_count: Math.max((currentPost?.like_count || 0) - 1, 0)
      })
      .eq('id', id)
      .select('like_count')
      .single()

    if (updateError) {
      console.error('좋아요 수 업데이트 에러:', updateError)
    }

    return NextResponse.json({ 
      message: '좋아요가 취소되었습니다.',
      like_count: updatedPost?.like_count
    })
  } catch (error) {
    console.error('좋아요 취소 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}