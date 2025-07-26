import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, requireAuth } from '@/lib/security'

/**
 * POST /api/users/avatar
 * 사용자 아바타 이미지 업로드
 */
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 인증 확인
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // FormData에서 파일 추출
    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // 파일 유효성 검사
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      )
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // 기존 아바타 URL 조회 (삭제를 위해)
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', session.user.id)
      .single()

    // 파일 업로드
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath)

    // 프로필 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)

    if (updateError) {
      // 업로드된 파일 삭제
      await supabase.storage
        .from('user-uploads')
        .remove([filePath])

      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // 기존 아바타 삭제 (있는 경우)
    if (profile?.avatar_url && profile.avatar_url.includes('user-uploads')) {
      const oldFilePath = profile.avatar_url.split('user-uploads/')[1]
      if (oldFilePath) {
        await supabase.storage
          .from('user-uploads')
          .remove([oldFilePath])
      }
    }

    return NextResponse.json({
      avatar_url: urlData.publicUrl,
      message: 'Avatar uploaded successfully',
    })
  } catch (error) {
    console.error('Avatar upload exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/avatar
 * 사용자 아바타 삭제
 */
export async function DELETE(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult

  try {
    // 인증 확인
    const authCheck = await requireAuth(request)
    if (authCheck instanceof NextResponse) return authCheck

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 현재 아바타 URL 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', session.user.id)
      .single()

    if (!profile?.avatar_url) {
      return NextResponse.json(
        { error: 'No avatar to delete' },
        { status: 404 }
      )
    }

    // 프로필에서 아바타 URL 제거
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Storage에서 파일 삭제
    if (profile.avatar_url.includes('user-uploads')) {
      const filePath = profile.avatar_url.split('user-uploads/')[1]
      if (filePath) {
        await supabase.storage
          .from('user-uploads')
          .remove([filePath])
      }
    }

    return NextResponse.json({
      message: 'Avatar deleted successfully',
    })
  } catch (error) {
    console.error('Avatar delete exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}