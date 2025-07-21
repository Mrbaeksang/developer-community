# 🚀 개발자 커뮤니티 플랫폼 아키텍처

## 목차
1. [시스템 개요](#1-시스템-개요)
2. [기술 스택](#2-기술-스택)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [페이지 구조 및 연결](#4-페이지-구조-및-연결)
5. [데이터베이스 설계](#5-데이터베이스-설계)
6. [API 엔드포인트](#6-api-엔드포인트)
7. [보안 및 권한](#7-보안-및-권한)
8. [개발 가이드](#8-개발-가이드)

## 1. 시스템 개요

개발자 지식 공유 및 소규모 커뮤니티 협업 플랫폼

### 핵심 기능
- **게시글**: 승인 후 공개, 카테고리 분류, 댓글/좋아요
- **커뮤니티**: 공개/비공개, 실시간 채팅, 메모/파일 공유
- **관리자**: 게시글 승인, 사용자/커뮤니티 관리, 통계

## 2. 기술 스택

```yaml
Frontend: Next.js 15.4.2, React 19, TypeScript, Tailwind CSS v4, Radix UI
Backend: Supabase (PostgreSQL, Auth, Realtime, Storage)
Deploy: Vercel
```

## 5. 데이터베이스 설계

### 주요 테이블
- **profiles**: 사용자 프로필 (username, display_name, role, avatar_url)
- **categories**: 게시글 카테고리 (name, slug, description, color)
- **posts**: 게시글 (title, content, status, category_id, author_id)
- **post_comments**: 댓글 (content, post_id, author_id, parent_id)
- **post_likes**: 좋아요 (post_id, user_id)
- **communities**: 커뮤니티 (name, description, is_public, max_members)
- **community_members**: 멤버십 (user_id, community_id, role, joined_at)
- **community_messages**: 채팅 (content, community_id, author_id)
- **community_memos**: 메모 (title, content, community_id, author_id)
- **community_files**: 파일 (name, url, size, community_id, uploaded_by)

## 3. 프로젝트 구조

### 📁 전체 디렉토리 구조
```
bootcamp-community/
├── 📄 package.json                 # 의존성 및 스크립트
├── 📄 next.config.ts               # Next.js 설정
├── 📄 tsconfig.json                # TypeScript 설정
├── 📄 eslint.config.mjs            # ESLint 설정
├── 📄 postcss.config.mjs           # PostCSS/Tailwind 설정
├── 📄 playwright.config.ts         # E2E 테스트 설정
├── 📄 ARCHITECTURE_FINAL.md        # 아키텍처 문서
├── 📄 README.md                    # 프로젝트 개요
├── 📄 CLAUDE.md                    # 개발 가이드
├── 📄 WORK_REPORT.md              # 개발 보고서
├── 📁 docs/                        # 추가 문서
├── 📁 public/                      # 정적 파일 (아이콘, 이미지)
├── 📁 src/                         # 소스 코드
│   ├── 📁 app/                     # Next.js App Router
│   │   ├── 📄 layout.tsx          # 전역 레이아웃
│   │   ├── 📄 page.tsx            # 메인 페이지 (게시글 피드)
│   │   ├── 📄 globals.css         # 전역 스타일
│   │   ├── 📄 loading.tsx         # 전역 로딩
│   │   ├── 📄 error.tsx           # 전역 에러 페이지
│   │   ├── 📄 not-found.tsx       # 404 페이지
│   │   ├── 📁 auth/               # 🔐 인증 시스템 (Frontend)
│   │   │   ├── 📁 login/
│   │   │   │   └── 📄 page.tsx    # 로그인 페이지
│   │   │   └── 📁 signup/
│   │   │       └── 📄 page.tsx    # 회원가입 페이지
│   │   ├── 📁 posts/              # 📝 게시글 시스템 (Frontend)
│   │   │   ├── 📄 page.tsx        # 게시글 목록
│   │   │   ├── 📁 write/
│   │   │   │   └── 📄 page.tsx    # 게시글 작성
│   │   │   ├── 📁 [id]/
│   │   │   │   ├── 📄 page.tsx    # 게시글 상세보기
│   │   │   │   └── 📁 edit/
│   │   │   │       └── 📄 page.tsx # 게시글 수정
│   │   │   └── 📁 category/
│   │   │       └── 📁 [category]/
│   │   │           └── 📄 page.tsx # 카테고리별 게시글
│   │   ├── 📁 communities/        # 👥 커뮤니티 시스템 (Frontend)
│   │   │   ├── 📄 page.tsx        # 커뮤니티 목록
│   │   │   ├── 📁 create/
│   │   │   │   └── 📄 page.tsx    # 커뮤니티 생성
│   │   │   └── 📁 [id]/
│   │   │       └── 📄 page.tsx    # 커뮤니티 상세 (채팅/메모/파일)
│   │   ├── 📁 admin/              # 👑 관리자 시스템 (Frontend)
│   │   │   ├── 📄 layout.tsx      # 관리자 레이아웃
│   │   │   ├── 📄 page.tsx        # 관리자 대시보드
│   │   │   ├── 📁 blog/
│   │   │   │   ├── 📁 categories/
│   │   │   │   │   └── 📄 page.tsx # 카테고리 관리
│   │   │   │   └── 📁 posts/
│   │   │   │       ├── 📄 page.tsx # 게시글 관리
│   │   │   │       ├── 📁 pending/
│   │   │   │       │   └── 📄 page.tsx # 승인 대기 게시글
│   │   │   │       └── 📁 [id]/
│   │   │   │           └── 📁 edit/
│   │   │   │               └── 📄 page.tsx # 게시글 수정
│   │   ├── 📁 contact/            # 문의 페이지 (Frontend)
│   │   │   └── 📄 page.tsx
│   │   └── 📁 api/                # 🔌 API 엔드포인트 (Backend)
│   │       ├── 📁 auth/           # 인증 API
│   │       │   └── 📁 logout/
│   │       │       └── 📄 route.ts
│   │       ├── 📁 posts/          # 게시글 API
│   │       │   ├── 📄 route.ts    # GET/POST 게시글
│   │       │   ├── 📁 search/
│   │       │   │   └── 📄 route.ts # 게시글 검색
│   │       │   └── 📁 [id]/
│   │       │       ├── 📄 route.ts # GET/PUT/DELETE 특정 게시글
│   │       │       ├── 📁 like/
│   │       │       │   └── 📄 route.ts # 좋아요/취소
│   │       │       └── 📁 comments/
│   │       │           └── 📄 route.ts # GET/POST 댓글
│   │       ├── 📁 comments/       # 댓글 API
│   │       │   └── 📁 [id]/
│   │       │       └── 📄 route.ts # PUT/DELETE 댓글
│   │       ├── 📁 communities/    # 커뮤니티 API
│   │       │   ├── 📄 route.ts    # GET/POST 커뮤니티
│   │       │   └── 📁 [id]/
│   │       │       ├── 📄 route.ts # GET/PUT 특정 커뮤니티
│   │       │       ├── 📁 messages/
│   │       │       │   └── 📄 route.ts # GET/POST 채팅 메시지
│   │       │       ├── 📁 memos/
│   │       │       │   ├── 📄 route.ts # GET/POST 메모
│   │       │       │   └── 📁 [memoId]/
│   │       │       │       └── 📄 route.ts # PUT/DELETE 메모
│   │       │       └── 📁 files/
│   │       │           ├── 📄 route.ts # GET/POST 파일
│   │       │           └── 📁 [fileId]/
│   │       │               └── 📁 download/
│   │       │                   └── 📄 route.ts # 파일 다운로드
│   │       ├── 📁 categories/     # 카테고리 API
│   │       │   └── 📄 route.ts
│   │       ├── 📁 stats/          # 통계 API
│   │       │   └── 📄 route.ts
│   │       ├── 📁 tags/           # 태그 API
│   │       │   └── 📄 route.ts
│   │       └── 📁 admin/          # 관리자 API
│   │           ├── 📁 categories/ # 카테고리 관리 API
│   │           │   ├── 📄 route.ts
│   │           │   └── 📁 [id]/
│   │           │       └── 📄 route.ts
│   │           └── 📁 posts/      # 게시글 관리 API
│   │               ├── 📄 route.ts
│   │               ├── 📁 stats/
│   │               │   └── 📄 route.ts
│   │               └── 📁 [id]/
│   │                   ├── 📁 approve/
│   │                   │   └── 📄 route.ts
│   │                   └── 📁 reject/
│   │                       └── 📄 route.ts
│   ├── 📁 components/             # 🧩 재사용 컴포넌트
│   │   ├── 📁 ui/                 # 기본 UI 컴포넌트 (26개)
│   │   │   ├── 📄 header.tsx      # 전역 헤더
│   │   │   ├── 📄 footer.tsx      # 전역 푸터
│   │   │   ├── 📄 button.tsx      # 버튼 컴포넌트
│   │   │   ├── 📄 card.tsx        # 카드 컴포넌트
│   │   │   ├── 📄 input.tsx       # 입력 컴포넌트
│   │   │   ├── 📄 textarea.tsx    # 텍스트 영역
│   │   │   ├── 📄 avatar.tsx      # 아바타 컴포넌트
│   │   │   ├── 📄 badge.tsx       # 뱃지 컴포넌트
│   │   │   ├── 📄 dialog.tsx      # 다이얼로그
│   │   │   ├── 📄 tabs.tsx        # 탭 컴포넌트
│   │   │   ├── 📄 table.tsx       # 테이블 컴포넌트
│   │   │   ├── 📄 loading.tsx     # 로딩 컴포넌트
│   │   │   ├── 📄 error.tsx       # 에러 컴포넌트
│   │   │   ├── 📄 skeleton.tsx    # 스켈레톤 로딩
│   │   │   ├── 📄 code-block.tsx  # 코드 블록
│   │   │   ├── 📄 tech-badge.tsx  # 기술 스택 뱃지
│   │   │   └── 📄 optimized-image.tsx # 최적화된 이미지
│   │   ├── 📁 community/          # 커뮤니티 전용 컴포넌트
│   │   │   ├── 📄 FileUploadModal.tsx # 파일 업로드 모달
│   │   │   └── 📄 MemoModal.tsx   # 메모 작성 모달
│   │   └── 📁 providers/          # 컨텍스트 프로바이더
│   │       └── 📄 header-provider.tsx
│   ├── 📁 hooks/                  # 🎣 커스텀 훅
│   │   ├── 📄 use-api.ts          # API 연동 훅 (React Query)
│   │   ├── 📄 use-debounced-search.ts # 디바운스 검색
│   │   ├── 📄 use-infinite-scroll.tsx # 무한 스크롤
│   │   └── 📄 use-performance.ts  # 성능 모니터링
│   ├── 📁 lib/                    # 🛠️ 유틸리티
│   │   ├── 📁 supabase/           # Supabase 설정
│   │   │   ├── 📄 client.ts       # 클라이언트 설정
│   │   │   ├── 📄 server.ts       # 서버 설정
│   │   │   └── 📄 middleware.ts   # 미들웨어 설정
│   │   ├── 📁 utils/              # 유틸리티 함수
│   │   │   ├── 📄 cn.ts           # 클래스명 유틸
│   │   │   ├── 📄 format.ts       # 포맷팅 함수
│   │   │   └── 📄 validation.ts   # 유효성 검사
│   │   ├── 📁 constants/          # 상수 정의
│   │   │   └── 📄 routes.ts       # 라우트 상수
│   │   └── 📄 supabase.ts         # Supabase 기본 설정
│   ├── 📁 providers/              # 전역 프로바이더
│   │   └── 📄 query-provider.tsx  # React Query 프로바이더
│   ├── 📁 styles/                 # 스타일 파일
│   │   └── 📄 developer-theme.css # 개발자 테마
│   ├── 📁 types/                  # TypeScript 타입
│   │   ├── 📄 database.types.ts   # Supabase 타입
│   │   └── 📄 index.ts            # 공통 타입
│   └── 📄 middleware.ts           # 인증 미들웨어
├── 📁 supabase/                   # Supabase 설정
│   ├── 📁 migrations/             # 데이터베이스 마이그레이션
│   │   ├── 📄 001_initial_schema.sql
│   │   ├── 📄 002_rls_policies.sql
│   │   └── 📄 003_seed_data.sql
│   └── 📄 seed.sql                # 초기 데이터
└── 📁 tests/                      # 🧪 E2E 테스트
    ├── 📄 main-page.spec.ts       # 메인 페이지 테스트
    ├── 📄 auth.spec.ts            # 인증 테스트
    ├── 📄 posts.spec.ts           # 게시글 테스트
    ├── 📄 communities.spec.ts     # 커뮤니티 테스트
    └── 📄 admin.spec.ts           # 관리자 테스트
```

## 4. 페이지 구조 및 연결

### 🌐 Frontend 페이지 구조

#### 공개 페이지 (인증 불필요)
- **`/` (app/page.tsx)**: 메인 페이지
  - 역할: 게시글 피드, 인기 게시글, 카테고리 필터
  - 연결: `/posts/[id]`, `/posts/category/[category]`, `/auth/login`
  - 백엔드: `GET /api/posts`, `GET /api/categories`

- **`/auth/login` (app/auth/login/page.tsx)**: 로그인
  - 역할: 사용자 로그인
  - 연결: `/auth/signup`, `/` (로그인 후)
  - 백엔드: Supabase Auth

- **`/auth/signup` (app/auth/signup/page.tsx)**: 회원가입
  - 역할: 신규 사용자 등록
  - 연결: `/auth/login`, `/` (가입 후)
  - 백엔드: Supabase Auth

- **`/posts` (app/posts/page.tsx)**: 게시글 목록
  - 역할: 전체 게시글 목록, 검색, 페이지네이션
  - 연결: `/posts/[id]`, `/posts/write` (로그인 시)
  - 백엔드: `GET /api/posts`, `GET /api/posts/search`

- **`/posts/[id]` (app/posts/[id]/page.tsx)**: 게시글 상세
  - 역할: 게시글 내용, 댓글, 좋아요
  - 연결: `/posts/[id]/edit` (작성자), `/auth/login` (비로그인 시)
  - 백엔드: `GET /api/posts/[id]`, `GET/POST /api/posts/[id]/comments`

- **`/posts/category/[category]` (app/posts/category/[category]/page.tsx)**: 카테고리별 게시글
  - 역할: 특정 카테고리 게시글 목록
  - 연결: `/posts/[id]`, `/`
  - 백엔드: `GET /api/posts?category=[category]`

#### 인증 필요 페이지
- **`/posts/write` (app/posts/write/page.tsx)**: 게시글 작성
  - 역할: 새 게시글 작성 (관리자 승인 필요)
  - 연결: `/posts/[id]` (작성 후), `/`
  - 백엔드: `POST /api/posts`

- **`/posts/[id]/edit` (app/posts/[id]/edit/page.tsx)**: 게시글 수정
  - 역할: 기존 게시글 수정 (작성자만)
  - 연결: `/posts/[id]` (수정 후)
  - 백엔드: `PUT /api/posts/[id]`

- **`/communities` (app/communities/page.tsx)**: 커뮤니티 목록
  - 역할: 공개/가입 가능한 커뮤니티 목록
  - 연결: `/communities/create`, `/communities/[id]`
  - 백엔드: `GET /api/communities`

- **`/communities/create` (app/communities/create/page.tsx)**: 커뮤니티 생성
  - 역할: 새 커뮤니티 생성
  - 연결: `/communities/[id]` (생성 후)
  - 백엔드: `POST /api/communities`

- **`/communities/[id]` (app/communities/[id]/page.tsx)**: 커뮤니티 상세
  - 역할: 실시간 채팅, 메모 공유, 파일 공유
  - 연결: `/communities` (나가기)
  - 백엔드: `GET /api/communities/[id]`, `GET/POST /api/communities/[id]/messages`, `GET/POST /api/communities/[id]/memos`, `GET/POST /api/communities/[id]/files`

#### 관리자 전용 페이지
- **`/admin` (app/admin/page.tsx)**: 관리자 대시보드
  - 역할: 전체 통계, 승인 대기 게시글 수, 사용자 통계
  - 연결: `/admin/blog/posts/pending`, `/admin/blog/categories`
  - 백엔드: `GET /api/stats`, `GET /api/admin/posts/stats`

- **`/admin/blog/posts/pending` (app/admin/blog/posts/pending/page.tsx)**: 게시글 승인 관리
  - 역할: 승인 대기 게시글 목록, 승인/거부
  - 연결: `/admin/blog/posts/[id]/edit`
  - 백엔드: `GET /api/admin/posts`, `POST /api/admin/posts/[id]/approve`, `POST /api/admin/posts/[id]/reject`

- **`/admin/blog/categories` (app/admin/blog/categories/page.tsx)**: 카테고리 관리
  - 역할: 카테고리 생성/수정/삭제
  - 연결: `/admin`
  - 백엔드: `GET/POST /api/admin/categories`, `PUT/DELETE /api/admin/categories/[id]`

- **`/admin/blog/posts/[id]/edit` (app/admin/blog/posts/[id]/edit/page.tsx)**: 관리자 게시글 수정
  - 역할: 관리자 권한으로 게시글 수정
  - 연결: `/admin/blog/posts/pending`
  - 백엔드: `PUT /api/posts/[id]`

### 🔌 Backend API 구조

#### 인증 API
- **`POST /api/auth/logout`**: 로그아웃 (세션 정리)

#### 게시글 API
- **`GET /api/posts`**: 게시글 목록 (공개, 페이지네이션)
- **`POST /api/posts`**: 게시글 생성 (인증 필요)
- **`GET /api/posts/search`**: 게시글 검색
- **`GET /api/posts/[id]`**: 특정 게시글 조회
- **`PUT /api/posts/[id]`**: 게시글 수정 (작성자/관리자)
- **`DELETE /api/posts/[id]`**: 게시글 삭제 (작성자/관리자)
- **`POST /api/posts/[id]/like`**: 좋아요 (인증 필요)
- **`DELETE /api/posts/[id]/like`**: 좋아요 취소
- **`GET /api/posts/[id]/comments`**: 댓글 목록
- **`POST /api/posts/[id]/comments`**: 댓글 작성 (인증 필요)

#### 댓글 API
- **`PUT /api/comments/[id]`**: 댓글 수정 (작성자/관리자)
- **`DELETE /api/comments/[id]`**: 댓글 삭제 (작성자/관리자)

#### 커뮤니티 API
- **`GET /api/communities`**: 커뮤니티 목록 (공개 + 가입한 커뮤니티)
- **`POST /api/communities`**: 커뮤니티 생성 (인증 필요)
- **`GET /api/communities/[id]`**: 커뮤니티 상세 (멤버만)
- **`PUT /api/communities/[id]`**: 커뮤니티 수정 (소유자)
- **`GET /api/communities/[id]/messages`**: 채팅 메시지 (멤버만)
- **`POST /api/communities/[id]/messages`**: 메시지 전송 (멤버만)
- **`GET /api/communities/[id]/memos`**: 메모 목록 (멤버만)
- **`POST /api/communities/[id]/memos`**: 메모 생성 (멤버만)
- **`PUT /api/communities/[id]/memos/[memoId]`**: 메모 수정 (작성자)
- **`DELETE /api/communities/[id]/memos/[memoId]`**: 메모 삭제 (작성자)
- **`GET /api/communities/[id]/files`**: 파일 목록 (멤버만)
- **`POST /api/communities/[id]/files`**: 파일 업로드 (멤버만)
- **`GET /api/communities/[id]/files/[fileId]/download`**: 파일 다운로드 (멤버만)

#### 카테고리 API
- **`GET /api/categories`**: 카테고리 목록 (공개)

#### 통계 API
- **`GET /api/stats`**: 전체 통계 (공개)

#### 태그 API
- **`GET /api/tags`**: 인기 태그 (공개)

#### 관리자 API
- **`GET /api/admin/posts`**: 관리자 게시글 목록 (관리자만)
- **`GET /api/admin/posts/stats`**: 게시글 통계 (관리자만)
- **`POST /api/admin/posts/[id]/approve`**: 게시글 승인 (관리자만)
- **`POST /api/admin/posts/[id]/reject`**: 게시글 거부 (관리자만)
- **`GET /api/admin/categories`**: 관리자 카테고리 목록 (관리자만)
- **`POST /api/admin/categories`**: 카테고리 생성 (관리자만)
- **`PUT /api/admin/categories/[id]`**: 카테고리 수정 (관리자만)
- **`DELETE /api/admin/categories/[id]`**: 카테고리 삭제 (관리자만)

### 🔄 페이지 간 데이터 플로우

```
메인 페이지 (/) → 게시글 상세 (/posts/[id]) → 게시글 수정 (/posts/[id]/edit)
     ↓                        ↓                           ↓
카테고리 필터 → 로그인 (/auth/login) → 게시글 작성 (/posts/write)
     ↓                        ↓                           ↓
커뮤니티 목록 (/communities) → 커뮤니티 생성 (/communities/create)
     ↓                                                    ↓
커뮤니티 상세 (/communities/[id]) ← ← ← ← ← ← ← ← ← ← ← ← ←
     ↓
관리자 대시보드 (/admin) → 게시글 승인 (/admin/blog/posts/pending)
     ↓                              ↓
카테고리 관리 (/admin/blog/categories) → 관리자 게시글 수정
```

## 6. API 엔드포인트

### 📊 API 엔드포인트 전체 목록 (28개)

#### 인증 API (1개)
```yaml
POST /api/auth/logout     # 로그아웃 처리
```

#### 게시글 API (8개)
```yaml
GET    /api/posts         # 게시글 목록 조회
POST   /api/posts         # 게시글 생성
GET    /api/posts/search  # 게시글 검색
GET    /api/posts/[id]    # 게시글 상세 조회
PUT    /api/posts/[id]    # 게시글 수정
DELETE /api/posts/[id]    # 게시글 삭제
POST   /api/posts/[id]/like    # 좋아요 추가
DELETE /api/posts/[id]/like    # 좋아요 취소
```

#### 댓글 API (3개)
```yaml
GET    /api/posts/[id]/comments  # 댓글 목록
POST   /api/posts/[id]/comments  # 댓글 작성
PUT    /api/comments/[id]        # 댓글 수정
DELETE /api/comments/[id]        # 댓글 삭제
```

#### 커뮤니티 API (9개)
```yaml
GET  /api/communities           # 커뮤니티 목록
POST /api/communities           # 커뮤니티 생성
GET  /api/communities/[id]      # 커뮤니티 상세
PUT  /api/communities/[id]      # 커뮤니티 수정
GET  /api/communities/[id]/messages      # 채팅 메시지 조회
POST /api/communities/[id]/messages      # 채팅 메시지 전송
GET  /api/communities/[id]/memos         # 메모 목록
POST /api/communities/[id]/memos         # 메모 생성
PUT  /api/communities/[id]/memos/[memoId]    # 메모 수정
DELETE /api/communities/[id]/memos/[memoId]  # 메모 삭제
GET  /api/communities/[id]/files         # 파일 목록
POST /api/communities/[id]/files         # 파일 업로드
GET  /api/communities/[id]/files/[fileId]/download  # 파일 다운로드
```

#### 기본 데이터 API (3개)
```yaml
GET /api/categories  # 카테고리 목록
GET /api/stats       # 전체 통계
GET /api/tags        # 인기 태그
```

#### 관리자 API (7개)
```yaml
GET    /api/admin/posts              # 관리자 게시글 목록
GET    /api/admin/posts/stats        # 게시글 통계
POST   /api/admin/posts/[id]/approve # 게시글 승인
POST   /api/admin/posts/[id]/reject  # 게시글 거부
GET    /api/admin/categories         # 카테고리 목록
POST   /api/admin/categories         # 카테고리 생성
PUT    /api/admin/categories/[id]    # 카테고리 수정
DELETE /api/admin/categories/[id]    # 카테고리 삭제
```

### 🔐 API 인증 레벨

#### 공개 API (인증 불필요)
- `GET /api/posts` - 게시글 목록
- `GET /api/posts/search` - 게시글 검색
- `GET /api/posts/[id]` - 게시글 상세
- `GET /api/posts/[id]/comments` - 댓글 목록
- `GET /api/categories` - 카테고리 목록
- `GET /api/stats` - 전체 통계
- `GET /api/tags` - 인기 태그

#### 인증 필요 API
- `POST /api/posts` - 게시글 작성
- `PUT /api/posts/[id]` - 게시글 수정 (작성자)
- `DELETE /api/posts/[id]` - 게시글 삭제 (작성자)
- `POST /api/posts/[id]/like` - 좋아요
- `POST /api/posts/[id]/comments` - 댓글 작성
- `PUT /api/comments/[id]` - 댓글 수정 (작성자)
- `DELETE /api/comments/[id]` - 댓글 삭제 (작성자)
- 모든 커뮤니티 API

#### 관리자 전용 API
- 모든 `/api/admin/*` 엔드포인트

## 7. 보안 및 권한

### Row Level Security (RLS)
- **posts**: 게시 상태에 따른 공개 정책, 관리자 전체 권한
- **community_messages**: 커뮤니티 멤버만 접근
- **community_memos/files**: 커뮤니티 멤버만 접근
- **profiles**: 본인 및 관리자 수정 권한

### 미들웨어 보호
- `/admin/*`: 관리자 역할 확인
- `/communities/*`: 인증 사용자만
- `/profile`: 로그인 필수

### Rate Limiting
- API: 분당 100회
- 인증: 15분당 5회  
- 업로드: 시간당 10회
- 채팅: 분당 60회

## 8. 개발 가이드

### 개발 환경 설정
```bash
# 저장소 클론 및 의존성 설치
git clone [repository-url] && cd bootcamp-community && npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local에 Supabase 키 입력

# 개발 서버 시작
npm run dev

# Supabase 설정
supabase start && supabase db push && npm run generate-types
```

### 코딩 규칙
- **컴포넌트**: PascalCase (BlogPostCard)
- **훅**: camelCase + use prefix (useBlogPosts)
- **타입**: PascalCase (BlogPost, TeamMember)
- **상수**: UPPER_SNAKE_CASE (MAX_TEAM_SIZE)
- **함수**: camelCase (formatDate)

### 구현 단계
1. **Phase 1 ✅**: 프로젝트 설정, 인증, 기본 UI (2주)
2. **Phase 2 ✅**: 게시글 시스템, 관리자 대시보드 (2주)
3. **Phase 3 ✅**: 커뮤니티 시스템, 회원 관리 (2주)
4. **Phase 4**: 실시간 채팅, 메모/파일 공유 (2주)
5. **Phase 5**: 칸반 보드, 태스크 관리 (2주)
6. **Phase 6**: 성능 최적화, 프로덕션 배포 (2주)

### 성능 최적화 체크리스트
- React.memo, useMemo/useCallback 적절히 사용
- 이미지 lazy loading, 가상 스크롤링
- 번들 크기 최적화, 트리 쉐이킹
- 적절한 인덱스, N+1 쿼리 방지
- Next.js 캐싱, React Query 캐싱 활용

---

**프로덕션 배포 준비 완료** - Next.js 15 + Supabase 기반 개발자 커뮤니티 플랫폼 🚀