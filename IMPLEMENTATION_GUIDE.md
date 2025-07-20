# 구현 가이드 - 부트캠프 개발자 커뮤니티

이 문서를 보고 단계별로 따라가며 프로젝트를 구현하세요.

## 🚀 빠른 시작

### 1. 프로젝트 초기 설정
```bash
# 이미 생성된 프로젝트에서 시작
cd bootcamp-community

# 의존성 설치
npm install

# 추가 패키지 설치 ✅
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query zustand
npm install @dnd-kit/sortable @dnd-kit/core
npm install react-markdown remark-gfm
npm install date-fns
npm install clsx tailwind-merge
npm install zod react-hook-form @hookform/resolvers
npm install @upstash/ratelimit @upstash/redis

# 개발 의존성 ✅
npm install -D @types/node
```

### 2. 환경 변수 설정
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Sentry (옵션)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## 📋 구현 체크리스트

### Phase 1: 기초 설정 (1-2주차) ✅ 진행 중

#### Day 1-2: 프로젝트 구조 설정 ✅ 완료
```bash
# 폴더 구조 생성 ✅
mkdir -p src/{app,features,lib,types,components}
mkdir -p src/app/{api,"(public)","(authenticated)",admin}
mkdir -p src/features/{auth,blog,teams,chat,tasks,common}
mkdir -p src/lib/{supabase,utils,constants}
```

**작업 목록:**
- [x] `src/lib/supabase/client.ts` 생성
- [x] `src/lib/supabase/server.ts` 생성  
- [x] `src/lib/supabase/middleware.ts` 생성
- [x] `src/lib/utils/cn.ts` 생성 (클래스 유틸)
- [x] `src/lib/constants/routes.ts` 생성

#### Day 3-4: Supabase 설정
```sql
-- supabase/migrations/001_initial_schema.sql
-- ARCHITECTURE_FINAL.md의 스키마를 복사하여 실행
```

**작업 목록:**
- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 마이그레이션
- [ ] RLS 정책 설정
- [ ] 타입 생성: `npm run generate-types`

#### Day 5-7: 인증 시스템
```typescript
// src/features/auth/hooks/useAuth.ts
export function useAuth() {
  // 구현할 내용:
  // - signUp
  // - signIn  
  // - signOut
  // - getUser
}
```

**작업 목록:**
- [ ] 로그인 페이지 생성
- [ ] 회원가입 페이지 생성
- [ ] 미들웨어 보호 구현
- [ ] 사용자 프로필 컴포넌트

### Phase 2: 블로그 시스템 (3-4주차)

#### Day 8-10: 블로그 관리자
```typescript
// src/app/admin/blog/posts/page.tsx
// 관리자 전용 포스트 관리 페이지
```

**작업 목록:**
- [ ] 관리자 레이아웃 생성
- [ ] 포스트 작성 폼 (마크다운 에디터)
- [ ] 포스트 목록 (테이블)
- [ ] 포스트 수정/삭제 기능

#### Day 11-14: 공개 블로그
```typescript
// src/app/(public)/blog/page.tsx
// 공개 블로그 목록 페이지
```

**작업 목록:**
- [ ] 블로그 목록 페이지 (카드 레이아웃)
- [ ] 블로그 상세 페이지
- [ ] 카테고리 필터링
- [ ] 댓글 시스템 구현

### Phase 3: 팀 시스템 (5-6주차)

#### Day 15-17: 팀 로테이션
```typescript
// src/app/admin/teams/rotations/page.tsx
// 팀 로테이션 관리
```

**작업 목록:**
- [ ] 로테이션 생성 UI
- [ ] 팀 자동 배정 로직
- [ ] 수동 팀 조정 기능
- [ ] 팀 히스토리 뷰

#### Day 18-21: 팀 대시보드
```typescript
// src/app/(authenticated)/teams/page.tsx
// 내 팀 정보
```

**작업 목록:**
- [ ] 현재 팀 정보 표시
- [ ] 팀 멤버 목록
- [ ] 팀 전환 애니메이션
- [ ] 팀별 접근 권한 테스트

### Phase 4: 팀 협업 도구 (7-8주차)

#### Day 22-25: 실시간 채팅
```typescript
// src/features/chat/components/ChatRoom.tsx
// 팀 채팅방 컴포넌트
```

**작업 목록:**
- [ ] 채팅 UI 구현
- [ ] 실시간 메시지 구독
- [ ] 온라인 상태 표시
- [ ] 메시지 입력 및 전송

#### Day 26-28: 팀 메모
```typescript
// src/app/(authenticated)/teams/[id]/memos/page.tsx
// 팀 메모 페이지
```

**작업 목록:**
- [ ] 메모 CRUD
- [ ] 메모 고정 기능
- [ ] 파일 첨부
- [ ] 검색 기능

### Phase 5: 태스크 관리 (9-10주차)

#### Day 29-32: 칸반 보드
```typescript
// src/features/tasks/components/KanbanBoard.tsx
// 드래그 앤 드롭 칸반 보드
```

**작업 목록:**
- [ ] 보드 레이아웃
- [ ] 드래그 앤 드롭 구현
- [ ] 컬럼 관리
- [ ] 태스크 카드 디자인

#### Day 33-35: 태스크 기능
```typescript
// src/features/tasks/components/TaskModal.tsx
// 태스크 상세 모달
```

**작업 목록:**
- [ ] 태스크 생성/수정
- [ ] 담당자 할당
- [ ] 우선순위 설정
- [ ] 댓글 및 활동 로그

### Phase 6: 최적화 및 배포 (11-12주차)

#### Day 36-38: 성능 최적화
**작업 목록:**
- [ ] 번들 분석 및 최적화
- [ ] 이미지 최적화 설정
- [ ] 가상 스크롤 구현
- [ ] 캐싱 전략 구현

#### Day 39-40: 테스팅
```typescript
// e2e/auth.spec.ts
// Playwright E2E 테스트
```

**작업 목록:**
- [ ] E2E 테스트 작성
- [ ] 컴포넌트 테스트
- [ ] 접근성 검사
- [ ] 성능 테스트

#### Day 41-42: 배포
**작업 목록:**
- [ ] Vercel 프로젝트 연결
- [ ] 환경 변수 설정
- [ ] 도메인 연결
- [ ] 모니터링 설정

## 🛠️ 주요 코드 스니펫

### Supabase 클라이언트 설정
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
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
            // 서버 컴포넌트에서는 쿠키 설정 불가
          }
        },
      },
    }
  )
}
```

### 실시간 채팅 훅
```typescript
// src/features/chat/hooks/useRealtimeChat.ts
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeChat(teamId: string) {
  const supabase = createClient()
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const channel = supabase
      .channel(`team:${teamId}`)
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

  const sendMessage = async (content: string) => {
    await supabase
      .from('team_messages')
      .insert({ team_id: teamId, content })
  }

  return { messages, sendMessage }
}
```

### 서버 액션 예시
```typescript
// src/app/admin/blog/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBlogPost(formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const category_id = formData.get('category_id') as string
  
  const { error } = await supabase
    .from('blog_posts')
    .insert({
      title,
      content,
      category_id,
      slug: generateSlug(title),
      status: 'draft'
    })
  
  if (error) throw error
  
  revalidatePath('/admin/blog/posts')
  redirect('/admin/blog/posts')
}
```

## 📝 매일 체크할 사항

### 개발 시작 전
- [ ] 최신 코드 pull
- [ ] 환경 변수 확인
- [ ] Supabase 로컬 실행 (선택)

### 개발 중
- [ ] 타입 안전성 확인
- [ ] RLS 정책 테스트
- [ ] 콘솔 에러 확인
- [ ] 실시간 기능 테스트

### 개발 완료 후
- [ ] 코드 포맷팅 (prettier)
- [ ] 린트 검사 (eslint)
- [ ] 타입 체크 (tsc)
- [ ] 커밋 메시지 작성

## 🐛 일반적인 문제 해결

### 1. Supabase 연결 문제
```typescript
// 항상 인증 상태 확인
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return redirect('/auth/login')
}
```

### 2. 타입 에러
```bash
# 타입 재생성
npm run generate-types
```

### 3. 실시간 구독 안됨
```typescript
// 채널 상태 확인
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected!')
  }
})
```

### 4. RLS 정책 문제
```sql
-- 정책 테스트
SELECT * FROM blog_posts
WHERE auth.uid() IS NOT NULL;
```

## 🎯 주간 목표

### Week 1-2: 기초
- 인증 시스템 완성
- 기본 레이아웃 구성
- 데이터베이스 연결

### Week 3-4: 블로그
- 관리자 대시보드
- 공개 블로그 페이지
- 댓글 시스템

### Week 5-6: 팀
- 팀 로테이션 로직
- 팀 대시보드
- 권한 시스템

### Week 7-8: 협업
- 실시간 채팅
- 팀 메모
- 파일 공유

### Week 9-10: 태스크
- 칸반 보드
- 드래그 앤 드롭
- 실시간 동기화

### Week 11-12: 마무리
- 성능 최적화
- 테스트 작성
- 배포 준비

---

## 📊 현재 진행 상황 (2025-01-20)

### ✅ 완료된 작업
1. **프로젝트 초기 설정**
   - Next.js 15.4.1 프로젝트 생성
   - TypeScript strict 모드 설정
   - Tailwind CSS v4 설정
   - 폴더 구조 생성

2. **기본 컴포넌트 구현**
   - Shadcn/ui 컴포넌트 (Button, Card, Input, Textarea, Label, Badge)
   - 레이아웃 컴포넌트 (RootLayout, PublicLayout, AuthenticatedLayout, AdminLayout)
   - 유틸리티 함수 (cn.ts, format.ts, validation.ts)

3. **UI 페이지 구현 (Mock 데이터)**
   - ✅ 인증 페이지 (/auth/login, /auth/signup)
   - ✅ 블로그 상세 페이지 (/blog/[id])
   - ✅ 블로그 작성/편집 페이지 (/admin/blog/posts/new)
   - ✅ 블로그 관리 페이지 (/admin/blog/posts)
   - ✅ 팀 채팅 UI (/teams/[id]/chat)
   - ✅ 태스크 보드 UI (/tasks)
   - ✅ 관리자 대시보드 (/admin)
   - ✅ 팀 페이지 (/teams)

4. **기타**
   - Supabase 클라이언트 설정 파일 생성 (연결 대기)
   - 환경 변수 파일 생성 (.env.local)
   - Next.js 15 params Promise 타입 대응

### ⏳ 다음 단계
1. **Supabase 연결**
   - Supabase 프로젝트 생성
   - 환경 변수에 실제 키 입력
   - 데이터베이스 스키마 마이그레이션

2. **인증 시스템 구현**
   - 실제 로그인/회원가입 연결
   - 미들웨어 보호 활성화
   - RLS 정책 설정

3. **데이터 연결**
   - Mock 데이터를 실제 데이터베이스로 교체
   - CRUD 작업 구현
   - 실시간 기능 연결

---

이 가이드를 따라 하루하루 꾸준히 구현해 나가세요! 🚀