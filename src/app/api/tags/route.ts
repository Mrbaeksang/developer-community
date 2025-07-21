import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

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

    // PostgreSQL에서 배열 태그를 unnest로 풀어서 개수 세기
    const { data: tagData, error } = await supabase
      .rpc('get_popular_tags', { tag_limit: limit })

    if (error) {
      console.error('태그 조회 에러:', error)
      
      // RPC 함수가 없으면 fallback으로 간단한 쿼리 사용
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('tags')
        .eq('status', 'approved')
        .not('tags', 'is', null)

      if (postsError) {
        console.error('게시글 태그 조회 에러:', postsError)
        return NextResponse.json(
          { error: '태그를 불러오는 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      // JavaScript에서 태그 집계
      const tagCounts: { [key: string]: number } = {}
      
      posts?.forEach((post) => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            if (tag && tag.trim()) {
              const cleanTag = tag.trim()
              tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1
            }
          })
        }
      })

      // 인기도 순으로 정렬하고 limit 적용
      const sortedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }))

      return NextResponse.json(sortedTags)
    }

    return NextResponse.json(tagData || [])
  } catch (error) {
    console.error('태그 조회 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}