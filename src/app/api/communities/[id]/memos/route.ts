import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/communities/[id]/memos - 커뮤니티 메모 조회
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

    // 메모 조회 (작성자 정보 포함)
    const { data: memos, error } = await supabase
      .from('community_memos')
      .select(`
        id,
        title,
        content,
        is_pinned,
        tags,
        created_at,
        updated_at,
        author_id,
        profiles:author_id (
          username,
          display_name
        )
      `)
      .eq('community_id', id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('메모 조회 실패:', error)
      return NextResponse.json({ error: '메모를 불러올 수 없습니다' }, { status: 500 })
    }

    // 응답 형식 변환
    const formattedMemos = memos.map(memo => {
      const memoWithProfiles = memo as typeof memo & {
        profiles?: {
          username: string
          display_name: string
        }
      }
      
      return {
        id: memo.id,
        author_id: memo.author_id,
        author: memoWithProfiles.profiles?.username || 'Unknown',
        title: memo.title,
        content: memo.content,
        is_pinned: memo.is_pinned,
        tags: memo.tags || [],
        created_at: memo.created_at,
        updated_at: memo.updated_at
      }
    })

    return NextResponse.json(formattedMemos)
  } catch (error) {
    console.error('메모 조회 오류:', error)
    return NextResponse.json({ error: '메모를 불러올 수 없습니다' }, { status: 500 })
  }
}

// POST /api/communities/[id]/memos - 새 메모 생성
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
    const { title, content, tags, is_pinned } = await request.json()

    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 입력 검증
    if (!title?.trim()) {
      return NextResponse.json({ error: '제목은 필수입니다' }, { status: 400 })
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: '내용은 필수입니다' }, { status: 400 })
    }

    if (title.trim().length > 100) {
      return NextResponse.json({ error: '제목은 100자를 초과할 수 없습니다' }, { status: 400 })
    }

    if (content.trim().length > 10000) {
      return NextResponse.json({ error: '내용은 10,000자를 초과할 수 없습니다' }, { status: 400 })
    }

    // 커뮤니티 멤버십 확인
    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', id)
      .eq('user_id', session.user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: '커뮤니티 멤버만 메모를 작성할 수 있습니다' }, { status: 403 })
    }

    // 사용자 정보 조회
    const { data: user } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()

    // 메모 저장
    const { data: newMemo, error } = await supabase
      .from('community_memos')
      .insert({
        community_id: id,
        author_id: session.user.id,
        title: title.trim(),
        content: content.trim(),
        tags: Array.isArray(tags) ? tags.filter(tag => tag.trim()) : [],
        is_pinned: Boolean(is_pinned),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('메모 저장 실패:', error)
      return NextResponse.json({ error: '메모 저장에 실패했습니다' }, { status: 500 })
    }

    // 응답 형식 변환
    const formattedMemo = {
      id: newMemo.id,
      author_id: newMemo.author_id,
      author: user?.username || 'Unknown',
      title: newMemo.title,
      content: newMemo.content,
      is_pinned: newMemo.is_pinned,
      tags: newMemo.tags || [],
      created_at: newMemo.created_at,
      updated_at: newMemo.updated_at
    }

    return NextResponse.json(formattedMemo, { status: 201 })
  } catch (error) {
    console.error('메모 생성 오류:', error)
    return NextResponse.json({ error: '메모 생성에 실패했습니다' }, { status: 500 })
  }
}