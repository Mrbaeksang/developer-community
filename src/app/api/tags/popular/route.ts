import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/security'

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)

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

    // 승인된 게시글의 태그들을 집계
    const { data: posts } = await supabase
      .from('posts')
      .select('tags')
      .eq('status', 'approved')
      .not('tags', 'is', null)

    if (!posts) {
      return NextResponse.json([])
    }

    // 태그 빈도 계산
    const tagCounts: Record<string, number> = {}
    
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          }
        })
      }
    })

    // 빈도순으로 정렬하여 상위 태그들 반환
    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return NextResponse.json(popularTags)
  } catch (error) {
    console.error('인기 태그 조회 에러:', error)
    return NextResponse.json(
      { error: '인기 태그를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}