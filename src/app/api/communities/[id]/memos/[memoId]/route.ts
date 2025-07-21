import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET /api/communities/[id]/memos/[memoId] - 특정 메모 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memoId: string }> }
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
    const { id, memoId } = await params

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

    // 메모 조회
    const { data: memo, error } = await supabase
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
          username
        )
      `)
      .eq('id', memoId)
      .eq('community_id', id)
      .single()

    if (error || !memo) {
      return NextResponse.json({ error: '메모를 찾을 수 없습니다' }, { status: 404 })
    }

    // 응답 형식 변환
    const memoWithProfiles = memo as typeof memo & {
      profiles?: {
        username: string
      }
    }
    
    const formattedMemo = {
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

    return NextResponse.json(formattedMemo)
  } catch (error) {
    console.error('메모 조회 오류:', error)
    return NextResponse.json({ error: '메모를 찾을 수 없습니다' }, { status: 404 })
  }
}

// PUT /api/communities/[id]/memos/[memoId] - 메모 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memoId: string }> }
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
    const { id, memoId } = await params
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

    // 메모 존재 및 소유권 확인
    const { data: existingMemo } = await supabase
      .from('community_memos')
      .select('author_id, community_id')
      .eq('id', memoId)
      .eq('community_id', id)
      .single()

    if (!existingMemo) {
      return NextResponse.json({ error: '메모를 찾을 수 없습니다' }, { status: 404 })
    }

    if (existingMemo.author_id !== session.user.id) {
      return NextResponse.json({ error: '본인이 작성한 메모만 수정할 수 있습니다' }, { status: 403 })
    }

    // 사용자 정보 조회
    const { data: user } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()

    // 메모 업데이트
    const { data: updatedMemo, error } = await supabase
      .from('community_memos')
      .update({
        title: title.trim(),
        content: content.trim(),
        tags: Array.isArray(tags) ? tags.filter(tag => tag.trim()) : [],
        is_pinned: Boolean(is_pinned),
        updated_at: new Date().toISOString()
      })
      .eq('id', memoId)
      .eq('community_id', id)
      .select()
      .single()

    if (error) {
      console.error('메모 수정 실패:', error)
      return NextResponse.json({ error: '메모 수정에 실패했습니다' }, { status: 500 })
    }

    // 응답 형식 변환
    const formattedMemo = {
      id: updatedMemo.id,
      author_id: updatedMemo.author_id,
      author: user?.username || 'Unknown',
      title: updatedMemo.title,
      content: updatedMemo.content,
      is_pinned: updatedMemo.is_pinned,
      tags: updatedMemo.tags || [],
      created_at: updatedMemo.created_at,
      updated_at: updatedMemo.updated_at
    }

    return NextResponse.json(formattedMemo)
  } catch (error) {
    console.error('메모 수정 오류:', error)
    return NextResponse.json({ error: '메모 수정에 실패했습니다' }, { status: 500 })
  }
}

// DELETE /api/communities/[id]/memos/[memoId] - 메모 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memoId: string }> }
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
    const { id, memoId } = await params

    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 메모 존재 및 소유권 확인
    const { data: existingMemo } = await supabase
      .from('community_memos')
      .select('author_id, community_id')
      .eq('id', memoId)
      .eq('community_id', id)
      .single()

    if (!existingMemo) {
      return NextResponse.json({ error: '메모를 찾을 수 없습니다' }, { status: 404 })
    }

    if (existingMemo.author_id !== session.user.id) {
      return NextResponse.json({ error: '본인이 작성한 메모만 삭제할 수 있습니다' }, { status: 403 })
    }

    // 메모 삭제
    const { error } = await supabase
      .from('community_memos')
      .delete()
      .eq('id', memoId)
      .eq('community_id', id)

    if (error) {
      console.error('메모 삭제 실패:', error)
      return NextResponse.json({ error: '메모 삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ message: '메모가 삭제되었습니다' }, { status: 200 })
  } catch (error) {
    console.error('메모 삭제 오류:', error)
    return NextResponse.json({ error: '메모 삭제에 실패했습니다' }, { status: 500 })
  }
}