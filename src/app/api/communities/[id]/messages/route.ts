import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/communities/[id]/messages - 커뮤니티 메시지 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
            }
          }
        }
      }
    )
    
    const { id } = await params

    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 커뮤니티 멤버십 확인
    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', id)
      .eq('user_id', session.user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: '커뮤니티 멤버만 접근할 수 있습니다' }, { status: 403 })
    }

    // 메시지 조회 (사용자 정보 포함)
    const { data: messages, error } = await supabase
      .from('community_messages')
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles:user_id (
          username,
          display_name
        )
      `)
      .eq('community_id', id)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('메시지 조회 실패:', error)
      return NextResponse.json({ error: '메시지를 불러올 수 없습니다' }, { status: 500 })
    }

    // 응답 형식 변환
    const formattedMessages = messages.map(message => {
      const messageWithProfiles = message as typeof message & {
        profiles?: {
          username: string
          display_name: string
        }
      }
      
      return {
        id: message.id,
        user_id: message.user_id,
        username: messageWithProfiles.profiles?.username || 'Unknown',
        content: message.content,
        created_at: message.created_at
      }
    })

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error('메시지 조회 오류:', error)
    return NextResponse.json({ error: '메시지를 불러올 수 없습니다' }, { status: 500 })
  }
}

// POST /api/communities/[id]/messages - 메시지 전송
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
            }
          }
        }
      }
    )
    
    const { id } = await params
    const { content } = await request.json()

    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 내용 검증
    if (!content?.trim()) {
      return NextResponse.json({ error: '메시지 내용을 입력해주세요' }, { status: 400 })
    }

    if (content.trim().length > 1000) {
      return NextResponse.json({ error: '메시지는 1000자를 초과할 수 없습니다' }, { status: 400 })
    }

    // 커뮤니티 멤버십 확인
    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', id)
      .eq('user_id', session.user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: '커뮤니티 멤버만 메시지를 보낼 수 있습니다' }, { status: 403 })
    }

    // 사용자 정보 조회
    const { data: user } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', session.user.id)
      .single()

    // 메시지 저장
    const { data: newMessage, error } = await supabase
      .from('community_messages')
      .insert({
        community_id: id,
        user_id: session.user.id,
        content: content.trim(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('메시지 저장 실패:', error)
      return NextResponse.json({ error: '메시지 전송에 실패했습니다' }, { status: 500 })
    }

    // 응답 형식 변환
    const formattedMessage = {
      id: newMessage.id,
      user_id: newMessage.user_id,
      username: user?.username || 'Unknown',
      content: newMessage.content,
      created_at: newMessage.created_at
    }

    return NextResponse.json(formattedMessage, { status: 201 })
  } catch (error) {
    console.error('메시지 전송 오류:', error)
    return NextResponse.json({ error: '메시지 전송에 실패했습니다' }, { status: 500 })
  }
}