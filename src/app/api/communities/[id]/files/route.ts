import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, validateUUID, sanitizeInput } from '@/lib/security'

// GET /api/communities/[id]/files - 커뮤니티 파일 목록 조회
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

    // 파일 목록 조회 (업로더 정보 포함)
    const { data: files, error } = await supabase
      .from('community_files')
      .select(`
        id,
        file_name,
        file_url,
        file_size,
        mime_type,
        description,
        download_count,
        created_at,
        uploaded_by_id,
        profiles:uploaded_by_id (
          username
        )
      `)
      .eq('community_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('파일 목록 조회 실패:', error)
      return NextResponse.json({ error: '파일 목록을 불러올 수 없습니다' }, { status: 500 })
    }

    // 응답 형식 변환
    const formattedFiles = files.map(file => {
      const fileWithProfiles = file as typeof file & {
        profiles?: {
          username: string
        }
      }
      
      return {
        id: file.id,
        file_name: file.file_name,
        file_url: file.file_url,
        file_size: file.file_size,
        mime_type: file.mime_type,
        uploaded_by: fileWithProfiles.profiles?.username || 'Unknown',
        uploaded_by_id: file.uploaded_by_id,
        description: file.description || '',
        download_count: file.download_count || 0,
        created_at: file.created_at
      }
    })

    return NextResponse.json(formattedFiles)
  } catch (error) {
    console.error('파일 목록 조회 오류:', error)
    return NextResponse.json({ error: '파일 목록을 불러올 수 없습니다' }, { status: 500 })
  }
}

// POST /api/communities/[id]/files - 파일 업로드
export async function POST(
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string

    // 인증 확인
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 파일 검증
    if (!file) {
      return NextResponse.json({ error: '파일을 선택해주세요' }, { status: 400 })
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다' }, { status: 400 })
    }

    // 파일명 검증
    if (!file.name.trim()) {
      return NextResponse.json({ error: '유효한 파일명이 필요합니다' }, { status: 400 })
    }

    // 설명 길이 제한 및 sanitization
    let sanitizedDescription = ''
    if (description) {
      if (description.length > 500) {
        return NextResponse.json({ error: '설명은 500자를 초과할 수 없습니다' }, { status: 400 })
      }
      sanitizedDescription = sanitizeInput(description)
    }

    // 커뮤니티 멤버십 확인
    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', id)
      .eq('user_id', session.user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: '커뮤니티 멤버만 파일을 업로드할 수 있습니다' }, { status: 403 })
    }

    // 사용자 정보 조회
    const { data: user } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single()

    // 파일명 중복 방지를 위한 고유 식별자 생성
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}_${file.name}`
    const storagePath = `communities/${id}/files/${uniqueFileName}`

    // Supabase Storage에 파일 업로드
    const { error: storageError } = await supabase.storage
      .from('community-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (storageError) {
      console.error('파일 스토리지 업로드 실패:', storageError)
      return NextResponse.json({ error: '파일 업로드에 실패했습니다' }, { status: 500 })
    }

    // 업로드된 파일의 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('community-files')
      .getPublicUrl(storagePath)

    // 데이터베이스에 파일 정보 저장
    const { data: newFile, error: dbError } = await supabase
      .from('community_files')
      .insert({
        community_id: id,
        uploaded_by_id: session.user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
        description: sanitizedDescription.trim() || '',
        download_count: 0,
        storage_path: storagePath,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('파일 정보 저장 실패:', dbError)
      
      // 스토리지에서 업로드된 파일 삭제 (롤백)
      await supabase.storage
        .from('community-files')
        .remove([storagePath])

      return NextResponse.json({ error: '파일 정보 저장에 실패했습니다' }, { status: 500 })
    }

    // 응답 형식 변환
    const formattedFile = {
      id: newFile.id,
      file_name: newFile.file_name,
      file_url: newFile.file_url,
      file_size: newFile.file_size,
      mime_type: newFile.mime_type,
      uploaded_by: user?.username || 'Unknown',
      uploaded_by_id: newFile.uploaded_by_id,
      description: newFile.description,
      download_count: newFile.download_count,
      created_at: newFile.created_at
    }

    return NextResponse.json(formattedFile, { status: 201 })
  } catch (error) {
    console.error('파일 업로드 오류:', error)
    return NextResponse.json({ error: '파일 업로드에 실패했습니다' }, { status: 500 })
  }
}