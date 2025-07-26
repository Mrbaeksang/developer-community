import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const supabase = await createClient()

    // 현재 세션 가져오기
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: '유효한 세션이 없습니다.' },
        { status: 401 }
      )
    }

    // 세션 새로고침
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token
    })

    if (error) {
      console.error('토큰 새로고침 에러:', error)
      return NextResponse.json(
        { error: '토큰 새로고침에 실패했습니다.' },
        { status: 500 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: '새로운 세션을 생성할 수 없습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in
      },
      user: data.user
    })
  } catch (error) {
    console.error('토큰 새로고침 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}