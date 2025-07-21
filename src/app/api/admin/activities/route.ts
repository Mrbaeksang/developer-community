import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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
              // Server Component에서 호출된 경우 무시
            }
          }
        }
      }
    )

    // 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    // 최근 관리자 활동 로그 조회 (프로필 정보와 함께)
    const { data: activities, error } = await supabase
      .from('admin_logs')
      .select(`
        id,
        action,
        target_type,
        target_id,
        details,
        created_at,
        admin_profiles:profiles!admin_logs_admin_id_fkey (
          username,
          display_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('활동 로그 조회 에러:', error)
      return NextResponse.json({ error: '활동 로그 조회에 실패했습니다.' }, { status: 500 })
    }

    // 응답 형식 가공 
    const formattedActivities = activities?.map((activity: Record<string, unknown>) => ({
      id: activity.id as string,
      type: (activity.target_type as string) || 'system',
      user: (() => {
        const profiles = activity.admin_profiles as { display_name?: string; username?: string } | null
        return profiles?.display_name || profiles?.username || 'System'
      })(),
      action: activity.action as string,
      target: activity.details ? 
        (typeof activity.details === 'object' && activity.details !== null && 'title' in activity.details 
          ? (activity.details as { title: string }).title 
          : JSON.stringify(activity.details)
        ) : 
        ((activity.target_id as string) || '시스템 작업'),
      time: formatTimeAgo(activity.created_at as string)
    })) || []

    return NextResponse.json(formattedActivities)
  } catch (error) {
    console.error('활동 로그 API 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 시간 포맷팅 헬퍼 함수
function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const past = new Date(dateString)
  const diffInMs = now.getTime() - past.getTime()
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInMinutes < 1) return '방금 전'
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`
  if (diffInHours < 24) return `${diffInHours}시간 전`
  if (diffInDays < 7) return `${diffInDays}일 전`
  
  return past.toLocaleDateString('ko-KR')
}