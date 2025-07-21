import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET: 커뮤니티 목록 조회
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const onlyMyCommunities = searchParams.get('my') === 'true'

    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    let query = supabase
      .from('communities')
      .select(`
        *,
        community_members!inner(
          user_id,
          role,
          joined_at
        ),
        owner:profiles!owner_id(
          id,
          username
        )
      `)

    // 내 커뮤니티만 조회하는 경우
    if (onlyMyCommunities) {
      query = query.eq('community_members.user_id', session.user.id)
    } else {
      // 공개 커뮤니티이거나 내가 멤버인 커뮤니티
      query = query.or(`is_public.eq.true,community_members.user_id.eq.${session.user.id}`)
    }

    const { data: communities, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('커뮤니티 조회 실패:', error)
      return NextResponse.json({ error: '커뮤니티를 불러오는데 실패했습니다' }, { status: 500 })
    }

    // 각 커뮤니티의 멤버 수 조회
    const communitiesWithCount = await Promise.all(
      communities.map(async (community) => {
        const { count } = await supabase
          .from('community_members')
          .select('*', { count: 'exact' })
          .eq('community_id', community.id)

        return {
          ...community,
          member_count: count || 0,
          is_member: community.community_members?.some(
            (member: { user_id: string }) => member.user_id === session.user.id
          ) || false
        }
      })
    )

    return NextResponse.json(communitiesWithCount)
  } catch (error) {
    console.error('커뮤니티 조회 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류' }, { status: 500 })
  }
}

// POST: 새 커뮤니티 생성
export async function POST(request: NextRequest) {
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

    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      slug, 
      description, 
      is_public, 
      max_members, 
      enable_chat, 
      enable_memos, 
      enable_files,
      tags 
    } = body

    // 유효성 검사
    if (!name?.trim()) {
      return NextResponse.json({ error: '커뮤니티 이름은 필수입니다' }, { status: 400 })
    }

    if (!slug?.trim()) {
      return NextResponse.json({ error: '슬러그는 필수입니다' }, { status: 400 })
    }

    if (max_members < 2 || max_members > 10) {
      return NextResponse.json({ error: '최대 인원은 2-10명이어야 합니다' }, { status: 400 })
    }

    // 슬러그 중복 확인
    const { data: existingCommunity } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', slug.trim())
      .single()

    if (existingCommunity) {
      return NextResponse.json({ error: '이미 사용 중인 슬러그입니다' }, { status: 400 })
    }

    // 트랜잭션으로 커뮤니티 생성 및 소유자 멤버십 추가
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .insert({
        name: name.trim(),
        slug: slug.trim(),
        description: description?.trim() || null,
        is_public: Boolean(is_public),
        max_members: Number(max_members),
        owner_id: session.user.id,
        settings: {
          enable_chat: Boolean(enable_chat),
          enable_memos: Boolean(enable_memos),
          enable_files: Boolean(enable_files)
        },
        tags: tags || []
      })
      .select()
      .single()

    if (communityError) {
      console.error('커뮤니티 생성 실패:', communityError)
      return NextResponse.json({ error: '커뮤니티 생성에 실패했습니다' }, { status: 500 })
    }

    // 소유자를 멤버로 추가
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: community.id,
        user_id: session.user.id,
        role: 'owner',
        joined_at: new Date().toISOString()
      })

    if (memberError) {
      console.error('멤버 추가 실패:', memberError)
      // 커뮤니티는 생성되었지만 멤버 추가 실패 - 정리 필요
      await supabase
        .from('communities')
        .delete()
        .eq('id', community.id)
      
      return NextResponse.json({ error: '커뮤니티 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(community, { status: 201 })
  } catch (error) {
    console.error('커뮤니티 생성 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류' }, { status: 500 })
  }
}