import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { rateLimit, sanitizeInput } from '@/lib/security'

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    let query = supabase
      .from('board_types')
      .select('*')
      .eq('is_active', true)
    
    // If slug is provided, filter by it (sanitized)
    if (slug) {
      const sanitizedSlug = sanitizeInput(slug)
      query = query.eq('slug', sanitizedSlug)
    }
    
    const { data: boardTypes, error } = await query.order('order_index')

    if (error) {
      throw error
    }

    return NextResponse.json(boardTypes)
  } catch (error) {
    console.error('Board types fetch error:', error)
    return NextResponse.json(
      { error: '게시판 타입을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}