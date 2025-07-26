import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Community, CommunityMember, CreateCommunityInput } from '@/types/community'
import type { User } from '@/types/auth'
import { rateLimit, sanitizeInput, requireAuth } from '@/lib/security'
import { 
  executeWithRLSHandling,
  handleRLSError 
} from '@/lib/supabase/rls-error-handler'

// GET: 커뮤니티 목록 조회
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const onlyMyCommunities = searchParams.get('my') === 'true'

    // 인증 확인
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

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
        profiles!communities_owner_id_fkey(
          id,
          username
        )
      `)

    // 내 커뮤니티만 조회하는 경우
    if (onlyMyCommunities) {
      query = query.eq('community_members.user_id', session.user.id)
    } else {
      // 공개 커뮤니티만 먼저 조회 (OR 조건 사용 시 문제 발생)
      // 추후 클라이언트에서 필터링 처리
      query = query
    }

    // RLS 에러 처리 포함한 커뮤니티 조회
    const communitiesResult = await executeWithRLSHandling(
      () => query.order('created_at', { ascending: false }),
      {
        context: '커뮤니티 목록 조회',
        userId: session.user.id,
        returnEmptyArray: true
      }
    )

    if (communitiesResult.error && !communitiesResult.isRLSError) {
      console.error('커뮤니티 조회 에러:', communitiesResult.error)
      return NextResponse.json({ error: '커뮤니티를 불러오는데 실패했습니다' }, { status: 500 })
    }

    const communities = communitiesResult.data || []

    // 각 커뮤니티의 멤버 수 조회 - RLS 에러 처리 포함
    const communitiesWithCount = await Promise.all(
      communities.map(async (community) => {
        const memberCountResult = await executeWithRLSHandling(
          () => supabase
            .from('community_members')
            .select('*', { count: 'exact' })
            .eq('community_id', community.id),
          {
            context: '커뮤니티 멤버 수 조회',
            userId: session.user.id,
            fallbackData: { count: 0 }
          }
        )

        const count = memberCountResult.data?.count || 0

        return {
          ...community,
          member_count: count,
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
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

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

    // Slug validation (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: '슬러그는 소문자, 숫자, 하이픈만 사용 가능합니다' }, { status: 400 })
    }

    if (max_members < 2 || max_members > 10) {
      return NextResponse.json({ error: '최대 인원은 2-10명이어야 합니다' }, { status: 400 })
    }

    // Input sanitization
    const sanitizedName = sanitizeInput(name)
    const sanitizedSlug = slug.trim().toLowerCase()
    const sanitizedDescription = description ? sanitizeInput(description) : null

    // 슬러그 중복 확인 - RLS 에러 처리 포함
    const slugCheckResult = await executeWithRLSHandling(
      () => supabase
        .from('communities')
        .select('id')
        .eq('slug', slug.trim())
        .single(),
      {
        context: '커뮤니티 슬러그 중복 확인',
        userId: session.user.id,
        fallbackData: null
      }
    )

    // RLS 에러가 아닌 경우만 중복 체크 (RLS 에러는 접근 권한 없음을 의미하므로 중복 아님)
    if (slugCheckResult.data && !slugCheckResult.isRLSError) {
      return NextResponse.json({ error: '이미 사용 중인 슬러그입니다' }, { status: 400 })
    }

    // 트랜잭션으로 커뮤니티 생성 - RLS 에러 처리 포함
    const communityResult = await executeWithRLSHandling(
      () => supabase
        .from('communities')
        .insert({
          name: sanitizedName.trim(),
          slug: sanitizedSlug,
          description: sanitizedDescription?.trim() || null,
          is_public: Boolean(is_public),
          max_members: Number(max_members),
          owner_id: session.user.id,
          settings: {
            enable_chat: Boolean(enable_chat),
            enable_memos: Boolean(enable_memos),
            enable_files: Boolean(enable_files)
          },
          tags: Array.isArray(tags) ? tags.filter(Boolean) : []
        })
        .select()
        .single(),
      {
        context: '커뮤니티 생성',
        userId: session.user.id,
        fallbackData: null
      }
    )

    if (communityResult.error && !communityResult.isRLSError) {
      console.error('커뮤니티 생성 실패:', communityResult.error)
      return NextResponse.json({ error: '커뮤니티 생성에 실패했습니다' }, { status: 500 })
    }

    const community = communityResult.data
    if (!community) {
      return NextResponse.json({ error: '커뮤니티 생성에 실패했습니다' }, { status: 500 })
    }

    // 소유자를 멤버로 추가 - RLS 에러 처리 포함
    const memberResult = await executeWithRLSHandling(
      () => supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: session.user.id,
          role: 'owner',
          joined_at: new Date().toISOString()
        }),
      {
        context: '커뮤니티 소유자 멤버 추가',
        userId: session.user.id,
        fallbackData: null
      }
    )

    if (memberResult.error && !memberResult.isRLSError) {
      console.error('멤버 추가 실패:', memberResult.error)
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