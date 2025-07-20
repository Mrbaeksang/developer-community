import { NextRequest, NextResponse } from 'next/server'

// GET /api/communities/[id]/memos - 커뮤니티 메모 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: 실제 데이터베이스 조회 로직
    const memos = [
      {
        id: '1',
        author_id: '1',
        author: 'devmaster',
        title: 'React Server Components 정리',
        content: `# React Server Components\n\n## 주요 개념\n- 서버에서 렌더링되는 React 컴포넌트\n- 클라이언트 번들 크기 감소\n- 데이터베이스 직접 접근 가능`,
        is_pinned: true,
        tags: ['React', 'RSC', 'Next.js'],
        created_at: '2025-01-18T14:00:00Z',
        updated_at: '2025-01-18T14:00:00Z'
      }
    ]

    return NextResponse.json(memos)
  } catch (error) {
    return NextResponse.json(
      { error: '메모를 불러올 수 없습니다' },
      { status: 500 }
    )
  }
}

// POST /api/communities/[id]/memos - 메모 생성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, content, tags } = await request.json()
    
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: '제목과 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    // TODO: 실제 데이터베이스 저장 로직
    const newMemo = {
      id: Date.now().toString(),
      community_id: params.id,
      author_id: '1', // TODO: 실제 사용자 ID
      author: 'devmaster', // TODO: 실제 사용자명
      title,
      content,
      tags: tags || [],
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(newMemo, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: '메모 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}