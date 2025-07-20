import { NextRequest, NextResponse } from 'next/server'

// GET /api/communities/[id]/messages - 커뮤니티 메시지 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 실제 데이터베이스 조회 로직
    const messages = [
      { 
        id: '1', 
        user_id: '1', 
        username: 'devmaster', 
        content: '안녕하세요! React 스터디 커뮤니티에 오신 걸 환영합니다 👋', 
        created_at: '2025-01-20T10:00:00Z' 
      },
      { 
        id: '2', 
        user_id: '2', 
        username: 'react_lover', 
        content: '반갑습니다! 이번 주는 어떤 주제로 스터디하나요?', 
        created_at: '2025-01-20T10:05:00Z' 
      },
    ]

    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json(
      { error: '메시지를 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}

// POST /api/communities/[id]/messages - 메시지 전송
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content } = await request.json()
    
    if (!content?.trim()) {
      return NextResponse.json(
        { error: '메시지 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    // TODO: 실제 데이터베이스 저장 로직
    const newMessage = {
      id: Date.now().toString(),
      community_id: params.id,
      user_id: '1', // TODO: 실제 사용자 ID
      username: 'devmaster', // TODO: 실제 사용자명
      content,
      created_at: new Date().toISOString()
    }

    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: '메시지 전송에 실패했습니다' },
      { status: 500 }
    )
  }
}