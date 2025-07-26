import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, validateUUID } from '@/lib/security'

// GET /api/communities/[id]/stats - 커뮤니티 통계 조회
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

    // 병렬로 통계 데이터 조회
    const [
      memberCountResult,
      messageCountResult,
      memoCountResult,
      fileCountResult,
      postCountResult,
      recentActivityResult
    ] = await Promise.all([
      // 멤버 수
      supabase
        .from('community_members')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', id),
      
      // 메시지 수
      supabase
        .from('community_messages')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', id),
      
      // 메모 수
      supabase
        .from('community_memos')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', id),
      
      // 파일 수
      supabase
        .from('community_files')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', id),
      
      // 커뮤니티 포스트 수
      supabase
        .from('community_posts')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', id),
      
      // 최근 활동 (7일)
      supabase
        .from('community_messages')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // 활성 멤버 수 (최근 7일간 활동한 멤버)
    const { data: activeMembers } = await supabase
      .from('community_messages')
      .select('user_id')
      .eq('community_id', id)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const uniqueActiveMembers = new Set(activeMembers?.map(m => m.user_id) || [])

    // 가장 많이 다운로드된 파일
    const { data: topFiles } = await supabase
      .from('community_files')
      .select('id, file_name, download_count')
      .eq('community_id', id)
      .order('download_count', { ascending: false })
      .limit(5)

    // 총 다운로드 수
    const { data: totalDownloads } = await supabase
      .from('community_files')
      .select('download_count')
      .eq('community_id', id)

    const totalDownloadCount = totalDownloads?.reduce((sum, file) => sum + (file.download_count || 0), 0) || 0

    // 통계 응답 구성
    const stats = {
      members: {
        total: memberCountResult.count || 0,
        active_last_7_days: uniqueActiveMembers.size
      },
      content: {
        messages: messageCountResult.count || 0,
        memos: memoCountResult.count || 0,
        files: fileCountResult.count || 0,
        posts: postCountResult.count || 0
      },
      activity: {
        messages_last_7_days: recentActivityResult.count || 0,
        total_file_downloads: totalDownloadCount,
        top_downloaded_files: topFiles || []
      },
      generated_at: new Date().toISOString()
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('커뮤니티 통계 조회 오류:', error)
    return NextResponse.json({ error: '통계를 불러올 수 없습니다' }, { status: 500 })
  }
}