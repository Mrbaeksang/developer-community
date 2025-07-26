import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, validateUUID, sanitizeInput } from '@/lib/security'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    // UUID validation
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 커뮤니티 ID입니다.' },
        { status: 400 }
      )
    }

    // 커뮤니티 기본 정보 조회
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select(`
        id,
        name,
        slug,
        description,
        visibility,
        cover_image,
        icon_url,
        tags,
        max_members,
        created_by,
        created_at,
        updated_at,
        profiles!communities_created_by_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single()

    if (communityError || !community) {
      console.error('커뮤니티 조회 실패:', communityError)
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 멤버 수 조회
    const { count: memberCount, error: memberCountError } = await supabase
      .from('community_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('community_id', id)

    if (memberCountError) {
      console.error('멤버 수 조회 실패:', memberCountError)
    }

    // 멤버 목록 조회
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select(`
        user_id,
        role,
        joined_at,
        profiles!community_members_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('community_id', id)
      .order('joined_at', { ascending: true })

    if (membersError) {
      console.error('멤버 목록 조회 실패:', membersError)
    }

    // 현재 사용자의 멤버십 확인
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserMembership = session?.user ? 
      members?.find(member => member.user_id === session.user.id) : null

    // 응답 데이터 구성
    const responseData = {
      id: community.id,
      name: community.name,
      slug: community.slug,
      description: community.description,
      avatar_url: community.icon_url,
      is_public: community.visibility === 'public',
      is_default: false, // 기본 커뮤니티 여부는 추가 로직 필요
      member_count: memberCount || 0,
      max_members: community.max_members,
      owner_id: community.created_by,
      created_at: community.created_at,
      settings: {
        enable_chat: true, // 임시로 모든 기능 활성화
        enable_memos: true,
        enable_files: true
      },
      owner: community.profiles,
      members: members?.map(member => {
        const memberWithProfiles = member as typeof member & {
          profiles?: {
            id: string
            username: string
            display_name: string
            avatar_url: string
          }
        }
        
        return {
          id: member.user_id,
          username: memberWithProfiles.profiles?.username || 'Unknown',
          display_name: memberWithProfiles.profiles?.display_name,
          avatar_url: memberWithProfiles.profiles?.avatar_url,
          role: member.role,
          joined_at: member.joined_at,
          is_online: false, // 실시간 상태는 추후 구현
          is_current_user: session?.user?.id === member.user_id
        }
      }) || [],
      is_member: !!currentUserMembership,
      user_role: currentUserMembership?.role || null
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('커뮤니티 상세 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    // UUID validation
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 커뮤니티 ID입니다.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, description, tags, max_members } = body

    // Input validation
    if (!name?.trim()) {
      return NextResponse.json(
        { error: '커뮤니티 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    if (max_members && (max_members < 2 || max_members > 10)) {
      return NextResponse.json(
        { error: '최대 인원은 2-10명이어야 합니다.' },
        { status: 400 }
      )
    }

    // Input sanitization
    const sanitizedName = sanitizeInput(name)
    const sanitizedDescription = description ? sanitizeInput(description) : null

    // 권한 확인 (소유자 또는 관리자인지 확인)
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', id)
      .eq('user_id', session.user.id)
      .single()

    if (!membership || !['admin', 'moderator'].includes(membership.role)) {
      const { data: community } = await supabase
        .from('communities')
        .select('created_by')
        .eq('id', id)
        .single()

      if (!community || community.created_by !== session.user.id) {
        return NextResponse.json(
          { error: '수정 권한이 없습니다.' },
          { status: 403 }
        )
      }
    }

    // 커뮤니티 정보 업데이트
    const { data: updatedCommunity, error } = await supabase
      .from('communities')
      .update({
        name: sanitizedName.trim(),
        description: sanitizedDescription?.trim() || null,
        tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
        max_members: max_members || 5,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('커뮤니티 업데이트 실패:', error)
      return NextResponse.json(
        { error: '커뮤니티 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedCommunity)
  } catch (error) {
    console.error('커뮤니티 수정 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}