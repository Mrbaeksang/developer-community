import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, validateUUID } from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardTypeId: string }> }
) {
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

    const { boardTypeId } = await params

    // UUID validation
    if (!validateUUID(boardTypeId)) {
      return NextResponse.json(
        { error: '유효하지 않은 게시판 타입 ID입니다.' },
        { status: 400 }
      )
    }

    // 특정 board_type의 카테고리 조회
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('board_type_id', boardTypeId)
      .eq('is_active', true)
      .order('order_index')

    if (error) {
      console.error('카테고리 조회 에러:', error)
      return NextResponse.json(
        { error: '카테고리를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(categories || [])
  } catch (error) {
    console.error('카테고리 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}