import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, requireAdmin } from '@/lib/security'

// GET: 관리자용 게시글 통계 조회
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult
  try {
    const supabase = await createClient()

    // 관리자 권한 확인
    const adminCheck = await requireAdmin(request, supabase)
    if (adminCheck) return adminCheck

    // 오늘 날짜 (한국 시간 기준)
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    // 전체 통계 조회
    const [
      totalResult,
      pendingResult,
      approvedResult,
      rejectedResult,
      todayApprovedResult,
      todayRejectedResult
    ] = await Promise.all([
      // 전체 게시글 수
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true }),
      
      // 대기 중인 게시글 수
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // 승인된 게시글 수
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      
      // 거부된 게시글 수
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected'),
      
      // 오늘 승인된 게시글 수
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('updated_at', todayStart)
        .lt('updated_at', todayEnd),
      
      // 오늘 거부된 게시글 수
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .gte('updated_at', todayStart)
        .lt('updated_at', todayEnd)
    ])

    // 에러 처리
    if (totalResult.error || pendingResult.error || approvedResult.error || 
        rejectedResult.error || todayApprovedResult.error || todayRejectedResult.error) {
      console.error('통계 조회 실패:', {
        totalResult: totalResult.error,
        pendingResult: pendingResult.error,
        approvedResult: approvedResult.error,
        rejectedResult: rejectedResult.error,
        todayApprovedResult: todayApprovedResult.error,
        todayRejectedResult: todayRejectedResult.error
      })
      return NextResponse.json({ error: '통계를 불러오는데 실패했습니다' }, { status: 500 })
    }

    // 응답 데이터 구성
    const stats = {
      total: totalResult.count || 0,
      pending: pendingResult.count || 0,
      approved: approvedResult.count || 0,
      rejected: rejectedResult.count || 0,
      today: {
        approved: todayApprovedResult.count || 0,
        rejected: todayRejectedResult.count || 0
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('통계 조회 오류:', error)
    return NextResponse.json({ error: '내부 서버 오류' }, { status: 500 })
  }
}