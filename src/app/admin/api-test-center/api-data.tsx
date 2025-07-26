import { 
  User, MessageSquare, FolderOpen, Shield, 
  Database, Activity, Users, Heart, Hash 
} from 'lucide-react'
import { ApiCategory } from './types'

export const apiCategories: ApiCategory[] = [
  {
    name: '인증',
    icon: <User className="w-4 h-4" />,
    description: '사용자 인증 및 세션 관리',
    tests: [
      {
        endpoint: '/api/auth/logout',
        method: 'POST',
        description: '사용자 로그아웃',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/auth/me',
        method: 'GET',
        description: '현재 사용자 정보 조회',
        implemented: true,
        requiresAuth: true
      }
    ]
  },
  {
    name: '게시글',
    icon: <MessageSquare className="w-4 h-4" />,
    description: '지식공유 게시글 관리',
    tests: [
      {
        endpoint: '/api/posts',
        method: 'GET',
        description: '게시글 목록 조회',
        implemented: true
      },
      {
        endpoint: '/api/posts',
        method: 'POST',
        description: '새 게시글 작성',
        implemented: true,
        requiresAuth: true,
        body: {
          title: '테스트 제목',
          content: '테스트 내용',
          board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
          category_id: '257ea94b-e0a3-4db4-b3fe-dd1363d71205',
          tags: ['test', 'api']
        }
      },
      {
        endpoint: '/api/posts/[id]',
        method: 'GET',
        description: '게시글 상세 조회',
        implemented: true
      },
      {
        endpoint: '/api/posts/[id]',
        method: 'PUT',
        description: '게시글 수정',
        implemented: true,
        requiresAuth: true,
        body: {
          title: '수정된 제목',
          content: '수정된 내용',
          board_type_id: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885',
          category_id: '257ea94b-e0a3-4db4-b3fe-dd1363d71205'
        }
      },
      {
        endpoint: '/api/posts/[id]',
        method: 'DELETE',
        description: '게시글 삭제',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/posts/[id]/like',
        method: 'POST',
        description: '게시글 좋아요',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/posts/[id]/like',
        method: 'DELETE',
        description: '게시글 좋아요 취소',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/posts/[id]/comments',
        method: 'GET',
        description: '게시글 댓글 목록',
        implemented: true
      },
      {
        endpoint: '/api/posts/[id]/comments',
        method: 'POST',
        description: '게시글 댓글 작성',
        implemented: true,
        requiresAuth: true,
        body: {
          content: '테스트 댓글',
          parent_id: null
        }
      },
      {
        endpoint: '/api/posts/search',
        method: 'GET',
        description: '게시글 검색',
        implemented: true
      }
    ]
  },
  {
    name: '자유게시판',
    icon: <FolderOpen className="w-4 h-4" />,
    description: '자유게시판 게시글 관리',
    tests: [
      {
        endpoint: '/api/free-posts',
        method: 'GET',
        description: '자유게시판 목록 조회',
        implemented: true
      },
      {
        endpoint: '/api/free-posts',
        method: 'POST',
        description: '자유게시판 글 작성',
        implemented: true,
        requiresAuth: true,
        body: {
          title: '자유게시판 테스트',
          content: '자유게시판 내용',
          board_type: 'daily'
        }
      },
      {
        endpoint: '/api/free-posts/[id]',
        method: 'GET',
        description: '자유게시판 글 상세',
        implemented: true
      },
      {
        endpoint: '/api/free-posts/[id]',
        method: 'PUT',
        description: '자유게시판 글 수정',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/free-posts/[id]',
        method: 'DELETE',
        description: '자유게시판 글 삭제',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/free-posts/[id]/like',
        method: 'POST',
        description: '자유게시판 좋아요',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/free-posts/[id]/comments',
        method: 'GET',
        description: '자유게시판 댓글 목록',
        implemented: true
      },
      {
        endpoint: '/api/free-posts/[id]/comments',
        method: 'POST',
        description: '자유게시판 댓글 작성',
        implemented: true,
        requiresAuth: true
      }
    ]
  },
  {
    name: '커뮤니티',
    icon: <Users className="w-4 h-4" />,
    description: '커뮤니티 관리 및 활동',
    tests: [
      {
        endpoint: '/api/communities',
        method: 'GET',
        description: '커뮤니티 목록 조회',
        implemented: true
      },
      {
        endpoint: '/api/communities',
        method: 'POST',
        description: '새 커뮤니티 생성',
        implemented: true,
        requiresAuth: true,
        body: {
          name: '테스트 커뮤니티',
          description: '테스트 설명',
          tags: ['test'],
          visibility: 'public',
          max_members: 10
        }
      },
      {
        endpoint: '/api/communities/[id]',
        method: 'GET',
        description: '커뮤니티 상세 정보',
        implemented: true
      },
      {
        endpoint: '/api/communities/[id]',
        method: 'PUT',
        description: '커뮤니티 정보 수정',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/communities/[id]',
        method: 'DELETE',
        description: '커뮤니티 삭제',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/communities/[id]/join',
        method: 'POST',
        description: '커뮤니티 참여',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/communities/[id]/leave',
        method: 'DELETE',
        description: '커뮤니티 탈퇴',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/communities/[id]/messages',
        method: 'GET',
        description: '커뮤니티 메시지 조회',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/communities/[id]/messages',
        method: 'POST',
        description: '커뮤니티 메시지 전송',
        implemented: true,
        requiresAuth: true,
        body: {
          content: '테스트 메시지'
        }
      },
      {
        endpoint: '/api/communities/[id]/memos',
        method: 'GET',
        description: '커뮤니티 메모 목록',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/communities/[id]/memos',
        method: 'POST',
        description: '커뮤니티 메모 작성',
        implemented: true,
        requiresAuth: true,
        body: {
          title: '메모 제목',
          content: '메모 내용'
        }
      },
      {
        endpoint: '/api/communities/[id]/memos/[memoId]',
        method: 'PUT',
        description: '커뮤니티 메모 수정',
        implemented: true,
        requiresAuth: true
      },
      {
        endpoint: '/api/communities/[id]/memos/[memoId]',
        method: 'DELETE',
        description: '커뮤니티 메모 삭제',
        implemented: true,
        requiresAuth: true
      }
    ]
  },
  {
    name: '관리자',
    icon: <Shield className="w-4 h-4" />,
    description: '관리자 전용 API',
    tests: [
      {
        endpoint: '/api/admin/stats',
        method: 'GET',
        description: '대시보드 통계',
        implemented: true,
        requiresAdmin: true
      },
      {
        endpoint: '/api/admin/posts',
        method: 'GET',
        description: '관리자 게시글 목록',
        implemented: true,
        requiresAdmin: true
      },
      {
        endpoint: '/api/admin/posts/[id]/approve',
        method: 'PATCH',
        description: '게시글 승인',
        implemented: true,
        requiresAdmin: true
      },
      {
        endpoint: '/api/admin/posts/[id]/approve',
        method: 'DELETE',
        description: '게시글 거부',
        implemented: true,
        requiresAdmin: true
      },
      {
        endpoint: '/api/admin/posts/stats',
        method: 'GET',
        description: '게시글 통계',
        implemented: true,
        requiresAdmin: true
      },
      {
        endpoint: '/api/admin/categories',
        method: 'GET',
        description: '카테고리 목록',
        implemented: true,
        requiresAdmin: true
      },
      {
        endpoint: '/api/admin/categories',
        method: 'POST',
        description: '카테고리 추가',
        implemented: true,
        requiresAdmin: true,
        body: {
          name: '새 카테고리',
          slug: 'new-category',
          description: '카테고리 설명'
        }
      },
      {
        endpoint: '/api/admin/categories/[id]',
        method: 'PUT',
        description: '카테고리 수정',
        implemented: true,
        requiresAdmin: true
      },
      {
        endpoint: '/api/admin/categories/[id]',
        method: 'DELETE',
        description: '카테고리 삭제',
        implemented: true,
        requiresAdmin: true
      },
      {
        endpoint: '/api/admin/activities',
        method: 'GET',
        description: '사용자 활동 내역',
        implemented: true,
        requiresAdmin: true
      }
    ]
  },
  {
    name: '카테고리',
    icon: <Database className="w-4 h-4" />,
    description: '카테고리 관리',
    tests: [
      {
        endpoint: '/api/categories',
        method: 'GET',
        description: '카테고리 목록 조회',
        implemented: true
      },
      {
        endpoint: '/api/categories/[boardId]',
        method: 'GET',
        description: '게시판별 카테고리 조회',
        implemented: true
      }
    ]
  },
  {
    name: '댓글',
    icon: <MessageSquare className="w-4 h-4" />,
    description: '댓글 관리',
    tests: [
      {
        endpoint: '/api/comments/[id]',
        method: 'PUT',
        description: '댓글 수정',
        implemented: true,
        requiresAuth: true,
        body: {
          content: '수정된 댓글'
        }
      },
      {
        endpoint: '/api/comments/[id]',
        method: 'DELETE',
        description: '댓글 삭제',
        implemented: true,
        requiresAuth: true
      }
    ]
  },
  {
    name: '태그',
    icon: <Hash className="w-4 h-4" />,
    description: '태그 관리',
    tests: [
      {
        endpoint: '/api/tags',
        method: 'GET',
        description: '전체 태그 목록',
        implemented: true
      },
      {
        endpoint: '/api/tags/popular',
        method: 'GET',
        description: '인기 태그 목록',
        implemented: true
      }
    ]
  },
  {
    name: '기타',
    icon: <Activity className="w-4 h-4" />,
    description: '기타 API',
    tests: [
      {
        endpoint: '/api/contact',
        method: 'POST',
        description: '문의하기',
        implemented: true,
        body: {
          name: '홍길동',
          email: 'test@example.com',
          subject: '문의 제목',
          message: '문의 내용'
        }
      },
      {
        endpoint: '/api/stats',
        method: 'GET',
        description: '전체 통계',
        implemented: true
      }
    ]
  }
]