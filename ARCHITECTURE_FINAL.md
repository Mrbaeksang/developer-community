# 부트캠프 개발자 커뮤니티 최종 아키텍처 v3.0

## 목차
1. [시스템 개요](#1-시스템-개요)
2. [아키텍처 원칙](#2-아키텍처-원칙)
3. [데이터베이스 설계](#3-데이터베이스-설계)
4. [API 설계](#4-api-설계)
5. [컴포넌트 구조](#5-컴포넌트-구조)
6. [실시간 기능](#6-실시간-기능)
7. [보안 및 권한](#7-보안-및-권한)
8. [구현 로드맵](#8-구현-로드맵)
9. [초보자 가이드](#9-초보자-가이드)

## 1. 시스템 개요

### 핵심 기능

#### 📝 개발자 블로그 플랫폼
- **관리자 전용 포스팅**: 오직 관리자만 글 작성 가능
- **카테고리**: AI 뉴스, 기술 트렌드, 개발 팁
- **댓글 시스템**: 인증된 사용자만 댓글 작성
- **조회수 트래킹**: 인기 글 파악

#### 👥 부트캠프 팀 협업
- **80명 학생 관리**: 효율적인 인원 관리
- **2주 단위 팀 로테이션**: 자동화된 팀 변경
- **팀별 격리된 공간**: 각 팀만의 채팅방, 게시판

#### 💬 팀 커뮤니케이션
- **실시간 채팅**: 팀별 전용 채팅방
- **팀 메모**: 중요 정보 고정
- **파일 공유**: 문서 및 이미지 공유

#### 📋 태스크 관리 (GitHub Projects 스타일)
- **칸반 보드**: Todo, In Progress, Done
- **태스크 할당**: 팀원별 업무 분배
- **진행 상황 추적**: 실시간 업데이트

### 기술 스택
```yaml
Frontend:
  - Next.js 15.4.1 (App Router)
  - React 19
  - TypeScript 5.x
  - Tailwind CSS v4

Backend:
  - Supabase Cloud
    - PostgreSQL 15
    - Auth (JWT)
    - Realtime (WebSocket)
    - Storage (S3 호환)

DevOps:
  - Vercel (Frontend)
  - GitHub Actions (CI/CD)
  - Sentry (모니터링)
  - Upstash Redis (Rate Limiting)
```

## 2. 아키텍처 원칙

### Server Components 우선 접근
```typescript
// ✅ 기본값: Server Component
// app/blog/page.tsx
export default async function BlogPage() {
  const posts = await getBlogPosts() // 서버에서 데이터 페칭
  return <BlogPostList posts={posts} />
}

// ✅ Client Component는 필요한 경우만
// app/blog/components/CommentForm.tsx
'use client'
export function CommentForm({ postId }: Props) {
  // 사용자 상호작용이 필요한 경우만
}
```

### 데이터 페칭 전략
```typescript
// 1. 정적 데이터 (캐시 우선)
const posts = await fetch(url, { 
  next: { revalidate: 3600 } // 1시간 캐시
})

// 2. 동적 데이터 (실시간)
const messages = await fetch(url, { 
  cache: 'no-store' 
})

// 3. 하이브리드 (ISR)
const teamData = await fetch(url, {
  next: { revalidate: 300, tags: ['team'] } // 5분, 태그 기반
})
```

## 3. 데이터베이스 설계

### 3.1 사용자 및 인증

```sql
-- 사용자 프로필 (auth.users 확장)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role TEXT CHECK (role IN ('super_admin', 'admin', 'member')) DEFAULT 'member',
  bootcamp_generation INTEGER, -- 기수 (예: 1기, 2기)
  github_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_generation ON profiles(bootcamp_generation);
```

### 3.2 블로그 시스템

```sql
-- 블로그 카테고리
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'ai-news', 'tech-trends', 'dev-tips'
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- 이모지 또는 아이콘 클래스
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 초기 카테고리 삽입
INSERT INTO blog_categories (slug, name, description, icon, display_order) VALUES
  ('ai-news', 'AI 뉴스', '최신 인공지능 동향과 뉴스', '🤖', 1),
  ('tech-trends', '기술 트렌드', '개발 트렌드와 신기술 소개', '🚀', 2),
  ('dev-tips', '개발 팁', '실무에서 유용한 개발 팁과 노하우', '💡', 3);

-- 블로그 포스트
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL 친화적 식별자
  content TEXT NOT NULL, -- Markdown
  excerpt TEXT, -- 요약 (SEO)
  cover_image TEXT, -- 커버 이미지
  category_id UUID REFERENCES blog_categories(id),
  author_id UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- SEO, 태그 등
);

-- 블로그 댓글
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  parent_id UUID REFERENCES blog_comments(id), -- 대댓글
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 조회수 추적 (중복 방지)
CREATE TABLE blog_post_views (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  ip_address INET,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id, viewed_at::date)
);

-- 인덱스
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id, status, published_at DESC);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_comments_post ON blog_comments(post_id, created_at);
```

### 3.3 팀 시스템

```sql
-- 팀 로테이션 주기
CREATE TABLE team_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation INTEGER NOT NULL, -- 부트캠프 기수
  rotation_number INTEGER NOT NULL, -- 회차 (1회차, 2회차...)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(generation, rotation_number)
);

-- 팀
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rotation_id UUID REFERENCES team_rotations(id),
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER DEFAULT 4, -- 팀당 최대 인원
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 팀 멤버
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  role TEXT CHECK (role IN ('leader', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- 팀 멤버 히스토리 (이전 팀 기록)
CREATE TABLE team_member_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES profiles(id),
  rotation_id UUID REFERENCES team_rotations(id),
  role TEXT,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_teams_rotation ON teams(rotation_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_history_user ON team_member_history(user_id, rotation_id);
```

### 3.4 팀 협업 기능

```sql
-- 팀 메모 (고정 공지)
CREATE TABLE team_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메모 첨부파일
CREATE TABLE memo_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id UUID REFERENCES team_memos(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 팀 채팅 메시지 (파티셔닝)
CREATE TABLE team_messages (
  id UUID DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'file', 'system')) DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
) PARTITION BY RANGE (created_at);

-- 월별 파티션 생성 (자동화 필요)
CREATE TABLE team_messages_2024_01 PARTITION OF team_messages
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 3.5 태스크 관리 시스템

```sql
-- 칸반 보드
CREATE TABLE task_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '팀 태스크 보드',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 보드 컬럼
CREATE TABLE board_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES task_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'Todo', 'In Progress', 'Done'
  display_order INTEGER NOT NULL,
  color TEXT, -- 헥사 색상
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, display_order)
);

-- 태스크
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES task_boards(id) ON DELETE CASCADE,
  column_id UUID REFERENCES board_columns(id),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  due_date DATE,
  display_order INTEGER,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- 태그, 라벨 등
);

-- 태스크 할당
CREATE TABLE task_assignments (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);

-- 태스크 댓글
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 태스크 활동 로그
CREATE TABLE task_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'created', 'moved', 'assigned', 'completed'
  from_column_id UUID REFERENCES board_columns(id),
  to_column_id UUID REFERENCES board_columns(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_tasks_board_column ON tasks(board_id, column_id, display_order);
CREATE INDEX idx_task_assignments_user ON task_assignments(user_id);
CREATE INDEX idx_task_activities_task ON task_activities(task_id, created_at DESC);
```

### 3.6 알림 시스템

```sql
-- 알림
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL, -- 'blog_comment', 'task_assigned', 'team_mention', 'team_rotation'
  title TEXT NOT NULL,
  content TEXT,
  entity_type TEXT, -- 'blog_post', 'task', 'team'
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
```

## 4. API 설계

### 4.1 인증 API
```typescript
// app/api/auth/route.ts
POST   /api/auth/signup         // 회원가입
POST   /api/auth/login          // 로그인
POST   /api/auth/logout         // 로그아웃
GET    /api/auth/me             // 현재 사용자 정보
PATCH  /api/auth/profile        // 프로필 수정
```

### 4.2 블로그 API
```typescript
// 공개 API
GET    /api/blog/posts          // 게시글 목록 (페이지네이션, 필터)
GET    /api/blog/posts/[slug]   // 게시글 상세
GET    /api/blog/posts/trending // 인기 게시글
GET    /api/blog/categories     // 카테고리 목록

// 인증 필요
GET    /api/blog/posts/[id]/comments    // 댓글 목록
POST   /api/blog/posts/[id]/comments    // 댓글 작성
PATCH  /api/blog/comments/[id]         // 댓글 수정
DELETE /api/blog/comments/[id]         // 댓글 삭제

// 관리자 전용
POST   /api/admin/blog/posts           // 게시글 작성
PATCH  /api/admin/blog/posts/[id]      // 게시글 수정
DELETE /api/admin/blog/posts/[id]      // 게시글 삭제
POST   /api/admin/blog/posts/[id]/publish // 게시글 발행
```

### 4.3 팀 관리 API
```typescript
// 팀 로테이션 (관리자)
POST   /api/admin/teams/rotate         // 새 로테이션 생성
GET    /api/admin/teams/rotations      // 로테이션 히스토리
POST   /api/admin/teams/assign         // 수동 팀 배정

// 팀 정보
GET    /api/teams                      // 현재 사용자의 팀
GET    /api/teams/[id]                 // 팀 상세
GET    /api/teams/[id]/members         // 팀 멤버 목록
GET    /api/teams/history              // 과거 팀 히스토리
```

### 4.4 팀 협업 API
```typescript
// 팀 메모
GET    /api/teams/[id]/memos           // 메모 목록
POST   /api/teams/[id]/memos           // 메모 작성
PATCH  /api/teams/[id]/memos/[mid]     // 메모 수정
DELETE /api/teams/[id]/memos/[mid]     // 메모 삭제
POST   /api/teams/[id]/memos/[mid]/pin // 메모 고정

// 팀 채팅
GET    /api/teams/[id]/messages        // 최근 메시지
POST   /api/teams/[id]/messages        // 메시지 전송
GET    /api/teams/[id]/messages/search // 메시지 검색

// 파일 업로드
POST   /api/upload                     // 파일 업로드 (Presigned URL)
DELETE /api/files/[id]                 // 파일 삭제
```

### 4.5 태스크 관리 API
```typescript
// 칸반 보드
GET    /api/teams/[id]/boards          // 팀 보드 목록
POST   /api/teams/[id]/boards          // 보드 생성
PATCH  /api/boards/[id]                // 보드 수정

// 컬럼 관리
POST   /api/boards/[id]/columns        // 컬럼 추가
PATCH  /api/columns/[id]               // 컬럼 수정
DELETE /api/columns/[id]               // 컬럼 삭제

// 태스크
GET    /api/boards/[id]/tasks          // 태스크 목록
POST   /api/boards/[id]/tasks          // 태스크 생성
PATCH  /api/tasks/[id]                 // 태스크 수정
DELETE /api/tasks/[id]                 // 태스크 삭제
POST   /api/tasks/[id]/move            // 태스크 이동
POST   /api/tasks/[id]/assign          // 태스크 할당
POST   /api/tasks/[id]/comments        // 댓글 추가
```

### 4.6 알림 API
```typescript
GET    /api/notifications              // 알림 목록
PATCH  /api/notifications/[id]/read    // 읽음 처리
POST   /api/notifications/read-all     // 모두 읽음
GET    /api/notifications/unread-count // 읽지 않은 개수
```

## 5. 컴포넌트 구조

### 5.1 디렉토리 구조
```
src/
├── app/                              # Next.js App Router
│   ├── (public)/                     # 공개 페이지
│   │   ├── layout.tsx               
│   │   ├── page.tsx                 # 랜딩/블로그 홈
│   │   ├── blog/
│   │   │   ├── page.tsx             # 블로그 목록
│   │   │   ├── [slug]/              
│   │   │   │   ├── page.tsx         # 블로그 상세
│   │   │   │   └── opengraph-image.tsx
│   │   │   └── category/[category]/ # 카테고리별
│   │   └── auth/
│   │       ├── login/
│   │       └── signup/
│   │
│   ├── (authenticated)/              # 인증 필요
│   │   ├── layout.tsx               # 인증 체크
│   │   ├── dashboard/               # 대시보드
│   │   ├── teams/
│   │   │   ├── page.tsx             # 내 팀
│   │   │   └── [id]/
│   │   │       ├── layout.tsx       # 팀 레이아웃
│   │   │       ├── page.tsx         # 팀 홈
│   │   │       ├── chat/            # 팀 채팅
│   │   │       ├── memos/           # 팀 메모
│   │   │       ├── tasks/           # 태스크 보드
│   │   │       └── @modal/(.)/...   # 모달 (Parallel Routes)
│   │   └── profile/
│   │
│   ├── admin/                        # 관리자 전용
│   │   ├── layout.tsx               # 관리자 체크
│   │   ├── blog/                    # 블로그 관리
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx         # 포스트 목록
│   │   │   │   ├── new/             # 새 포스트
│   │   │   │   └── [id]/edit/      # 포스트 편집
│   │   │   └── categories/          # 카테고리 관리
│   │   └── teams/                   # 팀 관리
│   │       ├── rotations/           # 로테이션 관리
│   │       └── members/             # 멤버 관리
│   │
│   └── api/                         # API Routes
│
├── features/                         # 기능별 모듈
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── UserMenu.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useSession.ts
│   │   ├── api/
│   │   │   └── auth.ts
│   │   └── types/
│   │       └── auth.types.ts
│   │
│   ├── blog/
│   │   ├── components/
│   │   │   ├── BlogPostCard.tsx
│   │   │   ├── BlogPostList.tsx
│   │   │   ├── BlogPostContent.tsx
│   │   │   ├── CommentSection.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   └── CategoryFilter.tsx
│   │   ├── hooks/
│   │   │   ├── useBlogPosts.ts
│   │   │   ├── useComments.ts
│   │   │   └── useCategories.ts
│   │   ├── api/
│   │   │   ├── posts.ts
│   │   │   └── comments.ts
│   │   └── types/
│   │
│   ├── teams/
│   │   ├── components/
│   │   │   ├── TeamCard.tsx
│   │   │   ├── TeamMemberList.tsx
│   │   │   ├── TeamRotationBanner.tsx
│   │   │   └── TeamSwitcher.tsx
│   │   ├── hooks/
│   │   │   ├── useCurrentTeam.ts
│   │   │   ├── useTeamMembers.ts
│   │   │   └── useTeamHistory.ts
│   │   └── api/
│   │
│   ├── chat/
│   │   ├── components/
│   │   │   ├── ChatRoom.tsx         # 'use client'
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   ├── OnlineIndicator.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── hooks/
│   │   │   ├── useRealtimeChat.ts
│   │   │   ├── usePresence.ts
│   │   │   └── useMessageHistory.ts
│   │   └── stores/
│   │       └── chatStore.ts         # Zustand
│   │
│   ├── tasks/
│   │   ├── components/
│   │   │   ├── KanbanBoard.tsx      # 'use client'
│   │   │   ├── TaskColumn.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskModal.tsx
│   │   │   └── TaskFilters.tsx
│   │   ├── hooks/
│   │   │   ├── useTasks.ts
│   │   │   ├── useTaskDragDrop.ts
│   │   │   └── useTaskActivities.ts
│   │   └── utils/
│   │       └── dnd.utils.ts         # Drag & Drop
│   │
│   └── common/
│       ├── components/
│       │   ├── ui/                  # Shadcn/ui
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── dialog.tsx
│       │   │   └── ...
│       │   ├── layouts/
│       │   │   ├── Header.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── MobileNav.tsx
│       │   └── feedback/
│       │       ├── ErrorBoundary.tsx
│       │       ├── LoadingSpinner.tsx
│       │       └── EmptyState.tsx
│       └── hooks/
│           ├── useDebounce.ts
│           ├── useIntersection.ts
│           └── useMediaQuery.ts
│
├── lib/                             # 유틸리티
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   ├── middleware.ts           # Middleware client
│   │   └── admin.ts                # Service role client
│   ├── utils/
│   │   ├── cn.ts                   # Class names
│   │   ├── format.ts               # 포맷팅
│   │   └── validation.ts           # 유효성 검사
│   └── constants/
│       ├── routes.ts               # 라우트 상수
│       └── config.ts               # 앱 설정
│
└── types/                          # 전역 타입
    ├── database.types.ts           # Supabase 생성
    └── global.d.ts                 # 전역 타입
```

### 5.2 컴포넌트 패턴

#### Server Component (기본)
```tsx
// features/blog/components/BlogPostList.tsx
import { getBlogPosts } from '@/features/blog/api/posts'

export async function BlogPostList({ category }: Props) {
  const posts = await getBlogPosts({ category })
  
  return (
    <div className="grid gap-6">
      {posts.map(post => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

#### Client Component (상호작용)
```tsx
// features/chat/components/ChatRoom.tsx
'use client'

import { useRealtimeChat } from '../hooks/useRealtimeChat'

export function ChatRoom({ teamId }: Props) {
  const { messages, sendMessage, onlineUsers } = useRealtimeChat(teamId)
  
  return (
    <div className="flex flex-col h-full">
      <OnlineIndicator users={onlineUsers} />
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  )
}
```

## 6. 실시간 기능

### 6.1 채팅 시스템
```typescript
// features/chat/hooks/useRealtimeChat.ts
import { createClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'

export function useRealtimeChat(teamId: string) {
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel>()
  const [messages, setMessages] = useState<Message[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    // Private channel for team members only
    const channel = supabase.channel(`team:${teamId}`, {
      config: {
        private: true,
        presence: { key: userId }
      }
    })

    // 메시지 구독
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'team_messages',
        filter: `team_id=eq.${teamId}`
      }, (payload) => {
        handleNewMessage(payload.new as Message)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        updateOnlineUsers(state)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [teamId])

  // 메시지 전송 (옵티미스틱 업데이트)
  const sendMessage = async (content: string) => {
    const optimisticId = crypto.randomUUID()
    
    // 1. 즉시 UI 업데이트
    setMessages(prev => [...prev, {
      id: optimisticId,
      content,
      author_id: userId,
      created_at: new Date().toISOString(),
      status: 'sending'
    }])

    // 2. 서버 전송
    const { data, error } = await supabase
      .from('team_messages')
      .insert({ team_id: teamId, content })
      .select()
      .single()

    if (error) {
      // 3. 실패 시 롤백
      setMessages(prev => 
        prev.map(m => 
          m.id === optimisticId 
            ? { ...m, status: 'error' }
            : m
        )
      )
      return
    }

    // 4. 성공 시 교체
    setMessages(prev => 
      prev.map(m => 
        m.id === optimisticId ? data : m
      )
    )
  }

  return {
    messages,
    onlineUsers,
    sendMessage,
    loading: false
  }
}
```

### 6.2 태스크 보드 실시간 업데이트
```typescript
// features/tasks/hooks/useRealtimeTasks.ts
export function useRealtimeTasks(boardId: string) {
  useEffect(() => {
    const channel = supabase.channel(`board:${boardId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `board_id=eq.${boardId}`
      }, (payload) => {
        switch (payload.eventType) {
          case 'INSERT':
            addTask(payload.new)
            break
          case 'UPDATE':
            updateTask(payload.new)
            break
          case 'DELETE':
            removeTask(payload.old.id)
            break
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [boardId])
}
```

## 7. 보안 및 권한

### 7.1 Row Level Security (RLS)

```sql
-- 블로그 포스트: 누구나 읽기, 관리자만 쓰기
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published posts"
  ON blog_posts FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Admins can manage posts"
  ON blog_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- 팀 메시지: 팀 멤버만 읽기/쓰기
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view messages"
  ON team_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_id = team_messages.team_id
      AND user_id = auth.uid()
    )
  );

-- 태스크: 팀 멤버만 접근
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN task_boards tb ON tb.team_id = tm.team_id
      WHERE tb.id = tasks.board_id
      AND tm.user_id = auth.uid()
    )
  );
```

### 7.2 미들웨어 보호

```typescript
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  
  const path = request.nextUrl.pathname

  // 관리자 전용 경로
  if (path.startsWith('/admin')) {
    if (!user || user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // 인증 필요 경로
  const protectedPaths = ['/dashboard', '/teams', '/profile']
  if (protectedPaths.some(p => path.startsWith(p))) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 7.3 Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const rateLimits = {
  // API 기본 제한
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 분당 100회
    analytics: true,
  }),
  
  // 인증 제한
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 15분당 5회
  }),
  
  // 파일 업로드 제한
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'), // 시간당 10회
  }),
  
  // 채팅 메시지 제한
  chat: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 분당 60회
  }),
}

// 사용 예시
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await rateLimits.api.limit(ip)
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 })
  }
  
  // 계속 처리...
}
```

## 8. 구현 로드맵

### Phase 1: 기초 설정 (1-2주차) ✅ UI 완료
```yaml
목표: 프로젝트 기반 구축 및 인증 시스템

작업:
  1. Next.js 15 프로젝트 생성:
     - TypeScript, Tailwind CSS 설정
     - ESLint, Prettier 설정
     - 폴더 구조 생성
  
  2. Supabase 프로젝트 설정:
     - 데이터베이스 스키마 생성
     - RLS 정책 설정
     - 환경 변수 설정
  
  3. 인증 시스템 구현:
     - 회원가입/로그인 폼
     - 미들웨어 보호
     - 사용자 프로필 관리
  
  4. 기본 UI 컴포넌트:
     - Shadcn/ui 설정
     - 레이아웃 컴포넌트
     - 네비게이션

체크리스트:
  ✅ 프로젝트 초기화 완료
  ✅ 환경 변수 설정 완료 (.env.local)
  ✅ Supabase 클라이언트 설정 (client.ts, server.ts, middleware.ts)
  ✅ 기본 UI 컴포넌트 생성 (Button, Card, Input, Textarea, Label, Badge)
  ✅ 레이아웃 컴포넌트 생성 (RootLayout, PublicLayout, AuthenticatedLayout, AdminLayout)
  ✅ 인증 페이지 UI 생성 (로그인/회원가입)
  ✅ 기본 유틸리티 함수 구현 (cn.ts, format.ts, validation.ts)
  ✅ TypeScript strict 모드 설정
  ✅ Next.js 15 params Promise 타입 대응
  ✅ 모든 페이지 UI 구현 완료 (100%)
  ⏳ Supabase 프로젝트 생성 및 키 설정 (대기 중)
  ⏳ 데이터베이스 스키마 마이그레이션 (대기 중)
  ⏳ RLS 정책 설정 (대기 중)
  ⏳ 실제 인증 플로우 연결 (대기 중)

구현된 UI:
  ✅ 메인 랜딩 페이지 (/)
  ✅ 블로그 목록 페이지 (/blog)
  ✅ 블로그 상세 페이지 (/blog/[id])
  ✅ 블로그 카테고리 페이지 (/blog/category/[category])
  ✅ 로그인/회원가입 페이지 (/auth/login, /auth/signup)
  ✅ 사용자 대시보드 (/dashboard)
  ✅ 프로필 페이지 (/profile)
  ✅ 팀 목록 페이지 (/teams)
  ✅ 팀 홈 페이지 (/teams/[id])
  ✅ 팀 채팅 UI (/teams/[id]/chat)
  ✅ 팀 메모 페이지 (/teams/[id]/memos)
  ✅ 팀별 태스크 페이지 (/teams/[id]/tasks)
  ✅ 전체 태스크 보드 UI (/tasks)
  ✅ 관리자 대시보드 (/admin)
  ✅ 블로그 관리 페이지 (/admin/blog/posts)
  ✅ 블로그 작성 페이지 (/admin/blog/posts/new)
  ✅ 블로그 편집 페이지 (/admin/blog/posts/[id]/edit)
  ✅ 카테고리 관리 페이지 (/admin/blog/categories)
  ✅ 팀 로테이션 관리 페이지 (/admin/teams/rotations)
  ✅ 멤버 관리 페이지 (/admin/teams/members)
```

### Phase 2: 블로그 시스템 (3-4주차) ✅ UI 완료
```yaml
목표: 관리자 전용 블로그 플랫폼 구축

작업:
  1. 블로그 관리자 대시보드:
     - 포스트 CRUD
     - 카테고리 관리
     - 미리보기 기능
  
  2. 공개 블로그 페이지:
     - 포스트 목록 (무한 스크롤)
     - 포스트 상세 페이지
     - 카테고리 필터링
  
  3. 댓글 시스템:
     - 댓글 작성/수정/삭제
     - 대댓글 기능
     - 실시간 업데이트
  
  4. SEO 최적화:
     - 메타데이터 생성
     - 오픈그래프 이미지
     - 사이트맵 생성

체크리스트:
  ✅ 블로그 목록 페이지 UI
  ✅ 블로그 상세 페이지 UI
  ✅ 관리자 포스트 작성 UI
  ✅ 포스트 편집 UI
  ✅ 카테고리 관리 UI
  ✅ 카테고리별 필터링 UI
  ✅ 댓글 UI (프론트엔드만)
  - [ ] 블로그 CRUD API 연결
  - [ ] 댓글 시스템 백엔드 연결
  - [ ] 마크다운 에디터 실제 동작
  - [ ] 이미지 업로드 기능
```

### Phase 3: 팀 시스템 (5-6주차) ✅ UI 완료
```yaml
목표: 팀 로테이션 및 관리 시스템 구축

작업:
  1. 팀 로테이션 관리:
     - 2주 단위 자동 로테이션
     - 수동 팀 배정 기능
     - 팀 히스토리 추적
  
  2. 팀 대시보드:
     - 현재 팀 정보
     - 팀 멤버 목록
     - 팀 전환 UI
  
  3. 팀 격리:
     - 팀별 데이터 분리
     - RLS 정책 검증
     - 권한 테스트

체크리스트:
  ✅ 팀 목록 페이지 UI
  ✅ 팀 홈 페이지 UI
  ✅ 팀 로테이션 관리 UI
  ✅ 멤버 관리 UI
  - [ ] 팀 로테이션 로직
  - [ ] 팀 배정 API
  - [ ] 팀별 권한 시스템
  - [ ] 팀 전환 시 데이터 격리
  - [ ] 과거 팀 접근 제한
```

### Phase 4: 팀 협업 도구 (7-8주차) ✅ UI 완료
```yaml
목표: 실시간 채팅 및 메모 시스템 구축

작업:
  1. 실시간 채팅:
     - 메시지 전송/수신
     - 온라인 상태 표시
     - 타이핑 인디케이터
     - 메시지 검색
  
  2. 팀 메모:
     - 메모 CRUD
     - 메모 고정 기능
     - 파일 첨부
  
  3. 파일 관리:
     - Supabase Storage 설정
     - 파일 업로드 UI
     - 파일 미리보기

체크리스트:
  ✅ 팀 채팅 UI
  ✅ 팀 메모 UI
  - [ ] 실시간 채팅 구현
  - [ ] 메모 CRUD API
  - [ ] 파일 첨부 기능
  - [ ] 채팅 실시간 동기화
  - [ ] 오프라인 큐 작동
```

### Phase 5: 태스크 관리 (9-10주차) ✅ UI 완료
```yaml
목표: GitHub Projects 스타일 칸반 보드 구축

작업:
  1. 칸반 보드 UI:
     - 드래그 앤 드롭
     - 컬럼 관리
     - 태스크 필터링
  
  2. 태스크 기능:
     - 태스크 CRUD
     - 할당 기능
     - 우선순위 설정
     - 마감일 관리
  
  3. 활동 추적:
     - 태스크 히스토리
     - 실시간 업데이트
     - 알림 통합

체크리스트:
  ✅ 칸반 보드 UI
  ✅ 팀별 태스크 보드 UI
  ✅ 드래그 앤 드롭 기능
  - [ ] 태스크 CRUD API
  - [ ] 실시간 동기화
  - [ ] 담당자 할당 시스템
  - [ ] 태스크 검색/필터 백엔드
  - [ ] 활동 로그 기록
```

### Phase 6: 최적화 및 배포 (11-12주차)
```yaml
목표: 성능 최적화 및 프로덕션 배포

작업:
  1. 성능 최적화:
     - 번들 크기 최적화
     - 이미지 최적화
     - 캐싱 전략
     - 가상 스크롤링
  
  2. 모바일 대응:
     - 반응형 디자인
     - 터치 제스처
     - PWA 설정
  
  3. 테스팅:
     - E2E 테스트 (Playwright)
     - 성능 테스트
     - 접근성 검사
  
  4. 배포:
     - Vercel 배포
     - 도메인 설정
     - 모니터링 설정
     - 백업 전략

체크리스트:
  □ Lighthouse 점수 90+
  □ 모바일 사용성 확인
  □ 에러 추적 작동
  □ 자동 배포 파이프라인
```

## 9. 초보자 가이드

### 9.1 개발 시작하기

#### 환경 설정
```bash
# 1. 저장소 클론
git clone [repository-url]
cd bootcamp-community

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 Supabase 키 입력

# 4. 개발 서버 시작
npm run dev
```

#### Supabase 설정
```bash
# 1. Supabase CLI 설치
npm install -g supabase

# 2. 로컬 Supabase 시작
supabase start

# 3. 마이그레이션 실행
supabase db push

# 4. 타입 생성
npm run generate-types
```

### 9.2 코딩 규칙

#### 명명 규칙
```typescript
// 컴포넌트: PascalCase
export function BlogPostCard() {}

// 훅: camelCase with 'use' prefix
export function useBlogPosts() {}

// 타입/인터페이스: PascalCase
interface BlogPost {}
type TeamMember = {}

// 상수: UPPER_SNAKE_CASE
const MAX_TEAM_SIZE = 4

// 함수: camelCase
function formatDate() {}
```

#### 컴포넌트 작성 패턴
```tsx
// 1. Import 순서
import { useState } from 'react'              // React
import { useRouter } from 'next/navigation'  // Next.js
import { Button } from '@/components/ui'     // UI 컴포넌트
import { useBlogPosts } from '../hooks'      // 커스텀 훅
import type { BlogPost } from '../types'     // 타입

// 2. Props 인터페이스
interface BlogPostCardProps {
  post: BlogPost
  onEdit?: (id: string) => void
}

// 3. 컴포넌트 정의
export function BlogPostCard({ post, onEdit }: BlogPostCardProps) {
  // 4. 상태 관리
  const [isLoading, setIsLoading] = useState(false)
  
  // 5. 훅 사용
  const router = useRouter()
  
  // 6. 핸들러
  const handleClick = () => {
    router.push(`/blog/${post.slug}`)
  }
  
  // 7. 렌더링
  return (
    <Card onClick={handleClick}>
      {/* 컴포넌트 내용 */}
    </Card>
  )
}
```

### 9.3 자주 사용하는 패턴

#### 데이터 페칭 (Server Component)
```tsx
// app/blog/page.tsx
export default async function BlogPage() {
  const supabase = createClient()
  
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  
  if (error) {
    return <ErrorState message={error.message} />
  }
  
  return <BlogPostList posts={posts} />
}
```

#### 폼 처리 (Server Action)
```tsx
// app/blog/actions.ts
'use server'

export async function createComment(formData: FormData) {
  const supabase = createClient()
  
  const content = formData.get('content') as string
  const postId = formData.get('postId') as string
  
  const { error } = await supabase
    .from('blog_comments')
    .insert({ content, post_id: postId })
  
  if (error) throw error
  
  revalidatePath(`/blog/${postId}`)
}

// components/CommentForm.tsx
export function CommentForm({ postId }: Props) {
  return (
    <form action={createComment}>
      <input type="hidden" name="postId" value={postId} />
      <textarea name="content" required />
      <button type="submit">댓글 작성</button>
    </form>
  )
}
```

#### 실시간 구독
```tsx
// hooks/useRealtimeMessages.ts
export function useRealtimeMessages(teamId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  
  useEffect(() => {
    const channel = supabase
      .channel(`team-${teamId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'team_messages',
        filter: `team_id=eq.${teamId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
    
    return () => {
      channel.unsubscribe()
    }
  }, [teamId])
  
  return messages
}
```

### 9.4 디버깅 팁

#### 개발 도구 활용
```typescript
// 1. Supabase 쿼리 로깅
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .then(result => {
    console.log('Query result:', result)
    return result
  })

// 2. 컴포넌트 렌더링 추적
export function MyComponent() {
  console.log('MyComponent rendered')
  
  useEffect(() => {
    console.log('MyComponent mounted')
    return () => console.log('MyComponent unmounted')
  }, [])
}

// 3. 실시간 연결 상태 확인
channel.subscribe((status) => {
  console.log('Realtime status:', status)
})
```

#### 일반적인 문제 해결
```typescript
// 1. RLS 정책 문제
// 항상 인증 상태 확인
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Unauthorized')

// 2. 타입 에러
// 생성된 타입 사용
import { Database } from '@/types/database.types'
type Post = Database['public']['Tables']['blog_posts']['Row']

// 3. 실시간 구독 누수
// 항상 정리 함수 반환
useEffect(() => {
  const subscription = subscribe()
  return () => subscription.unsubscribe() // 중요!
}, [])
```

### 9.5 성능 최적화 체크리스트

```yaml
렌더링 최적화:
  □ React.memo 사용 (무거운 컴포넌트)
  □ useMemo/useCallback 적절히 사용
  □ 가상 스크롤 구현 (긴 목록)
  □ 이미지 lazy loading

번들 최적화:
  □ 동적 import 사용
  □ 트리 쉐이킹 확인
  □ 사용하지 않는 의존성 제거
  □ 번들 분석 도구 사용

데이터베이스 최적화:
  □ 적절한 인덱스 생성
  □ N+1 쿼리 방지
  □ 페이지네이션 구현
  □ 필요한 필드만 select

캐싱 전략:
  □ Next.js 캐싱 활용
  □ React Query 캐싱 설정
  □ 정적 자산 CDN 사용
  □ Service Worker 구현
```

---

이 문서를 참고하여 단계별로 구현해 나가시면 됩니다. 각 단계마다 체크리스트를 확인하면서 진행하세요. 궁금한 점이 있으면 언제든 질문해주세요! 🚀