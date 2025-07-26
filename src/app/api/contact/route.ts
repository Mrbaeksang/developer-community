import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, sanitizeInput } from '@/lib/security'
// import { createServerClient } from '@supabase/ssr' // 실제 구현 시 활성화
// import { cookies } from 'next/headers' // 실제 구현 시 활성화

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = await rateLimit(request)
  if (rateLimitResult) return rateLimitResult
  try {
    const body: ContactFormData = await request.json()
    const { name, email, subject, message } = body

    // 입력 검증
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      )
    }

    // Input sanitization
    const sanitizedName = sanitizeInput(name)
    const sanitizedSubject = sanitizeInput(subject)
    const sanitizedMessage = sanitizeInput(message)
    const sanitizedEmail = sanitizeInput(email)

    // 실제 구현 시 데이터베이스 저장 또는 이메일 발송
    // 예시:
    // await sendEmail({
    //   to: process.env.ADMIN_EMAIL,
    //   subject: `[문의] ${sanitizedSubject}`,
    //   body: `
    //     이름: ${sanitizedName}
    //     이메일: ${sanitizedEmail}
    //     제목: ${sanitizedSubject}
    //     내용: ${sanitizedMessage}
    //   `
    // })
    
    // 또는 데이터베이스 저장:
    // const { error } = await supabase
    //   .from('contact_submissions')
    //   .insert({
    //     name: sanitizedName,
    //     email: sanitizedEmail,
    //     subject: sanitizedSubject,
    //     message: sanitizedMessage,
    //     created_at: new Date().toISOString()
    //   })

    // 로그에 sanitized 데이터 사용 (실제 운영 시 제거)
    console.log('Contact form submission:', {
      name: sanitizedName,
      email: sanitizedEmail,
      subject: sanitizedSubject,
      message: sanitizedMessage
    })

    return NextResponse.json({
      success: true,
      message: '문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.'
    })

  } catch {
    // 문의 접수 실패 처리
    return NextResponse.json(
      { error: '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    )
  }
}