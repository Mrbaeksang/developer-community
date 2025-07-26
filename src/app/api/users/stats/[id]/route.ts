/**
 * 사용자 통계 API
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts 테이블 없음!
 * - ✅ posts 테이블만 사용 (모든 게시글)
 * - 📌 이 파일의 코드는 잘못된 테이블명 사용!
 *   - 63라인: free_posts → posts (조건: board_type_id='00f8f32b-faca-4947-94f5-812a0bb97c39')
 * 
 * ⚠️ 주의: posts 테이블에서 board_type_id로 필터링해야 함
 * 지식공유: board_type_id = 'cd49ac2e-5fc1-4b08-850a-61f95d29a885'
 * 자유게시판: board_type_id = '00f8f32b-faca-4947-94f5-812a0bb97c39'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, validateUUID } from '@/lib/security'

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    const { id } = await params

    // UUID validation
    if (!validateUUID(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 사용자 ID입니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 사용자 존재 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('id', id)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      console.error('프로필 조회 에러:', profileError)
      return NextResponse.json(
        { error: '사용자 정보를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    // 게시글 통계
    const { data: postStats, error: postError } = await supabase
      .from('posts')
      .select('id, status, view_count, like_count, comment_count', { count: 'exact' })
      .eq('author_id', id)

    if (postError) {
      console.error('게시글 통계 조회 에러:', postError)
    }

    // 자유게시판 통계
    const { data: freePostStats, error: freePostError } = await supabase
      .from('free_posts')
      .select('id, view_count, like_count, comment_count', { count: 'exact' })
      .eq('author_id', id)

    if (freePostError) {
      console.error('자유게시판 통계 조회 에러:', freePostError)
    }

    // 댓글 통계
    const { count: commentCount, error: commentError } = await supabase
      .from('post_comments')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', id)

    if (commentError) {
      console.error('댓글 통계 조회 에러:', commentError)
    }

    // 커뮤니티 참여 수
    const { count: communityCount, error: communityError } = await supabase
      .from('community_members')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', id)

    if (communityError) {
      console.error('커뮤니티 통계 조회 에러:', communityError)
    }

    // 통계 집계
    const publishedPosts = postStats?.filter(p => p.status === 'published') || []
    const totalViews = [...(postStats || []), ...(freePostStats || [])]
      .reduce((sum, post) => sum + (post.view_count || 0), 0)
    const totalLikes = [...(postStats || []), ...(freePostStats || [])]
      .reduce((sum, post) => sum + (post.like_count || 0), 0)
    const totalComments = [...(postStats || []), ...(freePostStats || [])]
      .reduce((sum, post) => sum + (post.comment_count || 0), 0)

    return NextResponse.json({
      user: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name
      },
      stats: {
        posts: {
          total: (postStats?.length || 0) + (freePostStats?.length || 0),
          published: publishedPosts.length,
          draft: postStats?.filter(p => p.status === 'draft').length || 0,
          pending: postStats?.filter(p => p.status === 'pending').length || 0
        },
        engagement: {
          total_views: totalViews,
          total_likes: totalLikes,
          total_comments_received: totalComments,
          total_comments_written: commentCount || 0
        },
        communities: {
          joined: communityCount || 0
        }
      }
    })
  } catch (error) {
    console.error('사용자 통계 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}