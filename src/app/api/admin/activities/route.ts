import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, requireAdmin } from '@/lib/security'

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
              // Server Component에서 호출된 경우 무시
            }
          }
        }
      }
    )

    // 관리자 권한 확인 - 새로운 시그니처 사용
    const adminResult = await requireAdmin(request)
    if (adminResult instanceof NextResponse) {
      return adminResult
    }
    
    // adminResult에서 supabase와 user 추출
    const { user } = adminResult
    console.log('활동 로그 조회 - 관리자:', user?.id)

    // admin_logs 테이블에서 활동 로그 조회
    const { data: activities, error } = await supabase
      .from('admin_logs')
      .select(`
        id,
        admin_id,
        action,
        target_type,
        target_id,
        details,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('활동 로그 조회 에러:', error)
      // RLS 에러인 경우 빈 배열 반환
      if (error.code === '42501' || error.message?.includes('permission')) {
        console.log('RLS 정책으로 인한 접근 제한, 빈 배열 반환')
        return NextResponse.json([])
      }
      return NextResponse.json({ error: '활동 로그 조회에 실패했습니다.' }, { status: 500 })
    }

    // 관리자 프로필 정보 조회
    const adminIds = [...new Set(activities?.map(a => a.admin_id).filter(Boolean) || [])]
    let profileMap = new Map()
    
    if (adminIds.length > 0) {
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', adminIds)
      
      profileMap = new Map(adminProfiles?.map(p => [p.id, p]) || [])
    }

    // admin_logs가 비어있는 경우 처리
    if (!activities || activities.length === 0) {
      console.log('활동 로그가 비어있음')
      return NextResponse.json([])
    }

    // 응답 형식 가공
    const formattedActivities = activities.map((log) => {
      const adminProfile = profileMap.get(log.admin_id)
      const adminName = adminProfile?.display_name || adminProfile?.username || '관리자'
      
      // details에서 추가 정보 추출
      const details = log.details || {}
      const targetName = details.target_name || log.target_id || '대상'
      
      return {
        id: log.id,
        type: log.target_type || 'system',
        user: adminName,
        action: log.action,
        target: targetName,
        time: formatTimeAgo(log.created_at)
      }
    })

    // 항상 배열을 반환하도록 보장
    return NextResponse.json(formattedActivities || [])
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