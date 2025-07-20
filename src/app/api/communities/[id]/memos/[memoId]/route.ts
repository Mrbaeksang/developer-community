import { NextRequest, NextResponse } from 'next/server'

// GET /api/communities/[id]/memos/[memoId] - 특정 메모 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; memoId: string } }
) {
  try {
    // TODO: 실제 데이터베이스 조회 로직
    const memo = {
      id: params.memoId,
      author_id: '1',
      author: 'devmaster',
      title: 'React Server Components 정리',
      content: `# React Server Components\n\n## 주요 개념\n- 서버에서 렌더링되는 React 컴포넌트\n- 클라이언트 번들 크기 감소\n- 데이터베이스 직접 접근 가능`,
      is_pinned: true,
      tags: ['React', 'RSC', 'Next.js'],
      created_at: '2025-01-18T14:00:00Z',
      updated_at: '2025-01-18T14:00:00Z'
    }

    return NextResponse.json(memo)
  } catch (error) {
    return NextResponse.json(
      { error: '메모를 찾을 수 없습니다' },
      { status: 404 }
    )
  }
}

// PUT /api/communities/[id]/memos/[memoId] - 메모 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memoId: string } }
) {
  try {
    const { title, content, tags, is_pinned } = await request.json()
    
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: '제목과 내용을 입력해주세요' },
        { status: 400 }
      )
    }

    // TODO: 실제 데이터베이스 업데이트 로직
    const updatedMemo = {
      id: params.memoId,
      community_id: params.id,
      author_id: '1',
      author: 'devmaster',
      title,
      content,
      tags: tags || [],
      is_pinned: is_pinned || false,
      created_at: '2025-01-18T14:00:00Z',
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(updatedMemo)
  } catch (error) {
    return NextResponse.json(
      { error: '메모 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/communities/[id]/memos/[memoId] - 메모 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memoId: string } }
) {
  try {
    // TODO: 실제 데이터베이스 삭제 로직
    
    return NextResponse.json(
      { message: '메모가 삭제되었습니다' },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: '메모 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}