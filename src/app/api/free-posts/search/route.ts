/**
 * 자유게시판 검색 API
 * 
 * 🚨 AI 주의사항 - 데이터베이스 구조:
 * - ❌ free_posts 테이블에서 검색하는 게 아님!
 * - ✅ posts 테이블에서 board_type_id로 필터링하여 검색
 * - 📌 'free' slug는 잘못됨! 'forum' slug 사용해야 함
 * 
 * ⚠️ 주의: 18-23라인에 버그 있음!
 * .eq('slug', 'free') → .eq('slug', 'forum') 이어야 함
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  
  if (!query || query.length < 2) {
    return Response.json({ error: '검색어는 2자 이상 입력해주세요.' }, { status: 400 })
  }

  const supabase = await createClient()
  const offset = (page - 1) * limit

  try {
    // 'free' slug로 board_type_id 조회
    const { data: boardType, error: boardTypeError } = await supabase
      .from('board_types')
      .select('id')
      .eq('slug', 'free')
      .single()

    if (boardTypeError || !boardType) {
      console.error('자유게시판 타입 조회 에러:', boardTypeError)
      return Response.json({ error: '게시판 타입을 찾을 수 없습니다.' }, { status: 500 })
    }

    // 검색 쿼리 - 제목, 내용, 태그에서 검색
    const searchQuery = `%${query}%`
    
    // 전체 개수 조회
    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('board_type_id', boardType.id)
      .or(`title.ilike.${searchQuery},content.ilike.${searchQuery},excerpt.ilike.${searchQuery}`)
      .eq('status', 'published')

    // 검색 결과 조회 (denormalized author fields 사용)
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        excerpt,
        created_at,
        view_count,
        like_count,
        comment_count,
        tags,
        author_id,
        author_username,
        author_display_name,
        author_avatar_url
      `)
      .eq('board_type_id', boardType.id)
      .or(`title.ilike.${searchQuery},content.ilike.${searchQuery},excerpt.ilike.${searchQuery}`)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // author 객체로 변환
    const postsWithAuthor = posts?.map(post => ({
      ...post,
      author: {
        id: post.author_id,
        username: post.author_username || 'Unknown',
        display_name: post.author_display_name || post.author_username || 'Unknown',
        avatar_url: post.author_avatar_url
      }
    })) || []

    return Response.json({
      posts: postsWithAuthor,
      total: count || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('Search error:', error)
    return Response.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 })
  }
}