import { NextRequest, NextResponse } from 'next/server'

// GET /api/communities/[id]/files - 커뮤니티 파일 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 실제 데이터베이스 조회 로직
    const files = [
      {
        id: '1',
        file_name: 'react-server-components.pdf',
        file_url: '/uploads/react-server-components.pdf',
        file_size: 2457600,
        mime_type: 'application/pdf',
        uploaded_by: 'devmaster',
        uploaded_by_id: '1',
        description: 'React Server Components 공식 문서 번역본',
        download_count: 12,
        created_at: '2025-01-18T15:00:00Z'
      },
      {
        id: '2',
        file_name: 'nextjs-example.zip',
        file_url: '/uploads/nextjs-example.zip',
        file_size: 524288,
        mime_type: 'application/zip',
        uploaded_by: 'react_lover',
        uploaded_by_id: '2',
        description: 'Next.js 14 예제 프로젝트',
        download_count: 8,
        created_at: '2025-01-19T10:00:00Z'
      }
    ]

    return NextResponse.json(files)
  } catch (error) {
    return NextResponse.json(
      { error: '파일 목록을 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}

// POST /api/communities/[id]/files - 파일 업로드
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json(
        { error: '파일을 선택해주세요' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB 이하여야 합니다' },
        { status: 400 }
      )
    }

    // TODO: 실제 파일 업로드 로직 (Supabase Storage 등)
    const uploadedFile = {
      id: Date.now().toString(),
      community_id: params.id,
      file_name: file.name,
      file_url: `/uploads/${file.name}`, // 임시 URL
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: 'devmaster', // TODO: 실제 사용자명
      uploaded_by_id: '1', // TODO: 실제 사용자 ID
      description: description || '',
      download_count: 0,
      created_at: new Date().toISOString()
    }

    return NextResponse.json(uploadedFile, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다' },
      { status: 500 }
    )
  }
}