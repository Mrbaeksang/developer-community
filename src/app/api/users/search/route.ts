import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, sanitizeInput } from '@/lib/security'

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [], total: 0 })
    }

    // Sanitize search query
    const sanitizedQuery = sanitizeInput(query)

    const supabase = await createClient()

    const { data: users, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .or(`username.ilike.%${sanitizedQuery}%,display_name.ilike.%${sanitizedQuery}%`)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('User search error:', error)
      return NextResponse.json({ error: '검색 중 오류가 발생했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      users: users || [],
      total: count || 0,
      hasMore: (count || 0) > 10
    })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}