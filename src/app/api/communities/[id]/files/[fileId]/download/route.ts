import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// GET /api/communities/[id]/files/[fileId]/download - 파일 다운로드
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const supabase = createClient()
    const { id, fileId } = await params

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
      return NextResponse.json({ error: '커뮤니티 멤버만 파일을 다운로드할 수 있습니다' }, { status: 403 })
    }

    // 파일 정보 조회
    const { data: fileInfo, error: fileError } = await supabase
      .from('community_files')
      .select('id, file_name, storage_path, mime_type, file_size, download_count')
      .eq('id', fileId)
      .eq('community_id', id)
      .single()

    if (fileError || !fileInfo) {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다' }, { status: 404 })
    }

    // 다운로드 카운트 증가
    const { error: updateError } = await supabase
      .from('community_files')
      .update({ 
        download_count: (fileInfo.download_count || 0) + 1 
      })
      .eq('id', fileId)

    if (updateError) {
      console.error('다운로드 카운트 업데이트 실패:', updateError)
      // 카운트 업데이트 실패는 다운로드를 막지 않음
    }

    // Supabase Storage에서 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('community-files')
      .download(fileInfo.storage_path)

    if (downloadError || !fileData) {
      console.error('파일 다운로드 실패:', downloadError)
      return NextResponse.json({ error: '파일 다운로드에 실패했습니다' }, { status: 500 })
    }

    // 파일 스트림을 응답으로 반환
    const headers = new Headers()
    headers.set('Content-Type', fileInfo.mime_type || 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.file_name)}"`)
    headers.set('Content-Length', fileInfo.file_size.toString())
    headers.set('Cache-Control', 'private, no-cache')

    return new NextResponse(fileData, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('파일 다운로드 오류:', error)
    return NextResponse.json({ error: '파일 다운로드에 실패했습니다' }, { status: 500 })
  }
}