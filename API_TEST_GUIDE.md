# API 테스트 가이드

## 인증 API

### GET /api/auth/me
현재 로그인한 사용자 정보 조회
```bash
curl http://localhost:3000/api/auth/me \
  -H "Cookie: sb-kqmacejxvulnltazvcyn-auth-token=..."
```

### POST /api/auth/logout
로그아웃
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: sb-kqmacejxvulnltazvcyn-auth-token=..."
```

## 게시글 API

### GET /api/posts
게시글 목록 조회
```bash
# 기본 조회
curl http://localhost:3000/api/posts

# 페이지네이션
curl "http://localhost:3000/api/posts?page=1&limit=20"

# 카테고리 필터
curl "http://localhost:3000/api/posts?category=tech"

# 상태 필터 (관리자)
curl "http://localhost:3000/api/posts?status=draft" \
  -H "Cookie: sb-kqmacejxvulnltazvcyn-auth-token=..."
```

### POST /api/posts
게시글 작성 (인증 필요)
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-kqmacejxvulnltazvcyn-auth-token=..." \
  -d '{
    "title": "테스트 게시글",
    "content": "게시글 내용입니다.",
    "category_id": "550e8400-e29b-41d4-a716-446655440001",
    "tags": ["javascript", "react"]
  }'
```

### GET /api/posts/:id
특정 게시글 조회 (실제 UUID 사용)
```bash
curl http://localhost:3000/api/posts/550e8400-e29b-41d4-a716-446655440000
```

### PUT /api/posts/:id
게시글 수정 (작성자 또는 관리자)
```bash
curl -X PUT http://localhost:3000/api/posts/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-kqmacejxvulnltazvcyn-auth-token=..." \
  -d '{
    "title": "수정된 제목",
    "content": "수정된 내용"
  }'
```

### DELETE /api/posts/:id
게시글 삭제 (작성자 또는 관리자)
```bash
curl -X DELETE http://localhost:3000/api/posts/550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: sb-kqmacejxvulnltazvcyn-auth-token=..."
```

## 좋아요 API

### POST /api/posts/:id/like
좋아요 추가
```bash
curl -X POST http://localhost:3000/api/posts/550e8400-e29b-41d4-a716-446655440000/like \
  -H "Cookie: sb-kqmacejxvulnltazvcyn-auth-token=..."
```

### DELETE /api/posts/:id/like
좋아요 취소
```bash
curl -X DELETE http://localhost:3000/api/posts/550e8400-e29b-41d4-a716-446655440000/like \
  -H "Cookie: sb-kqmacejxvulnltazvcyn-auth-token=..."
```

### GET /api/posts/:id/like/status
좋아요 상태 확인
```bash
curl http://localhost:3000/api/posts/550e8400-e29b-41d4-a716-446655440000/like/status \
  -H "Cookie: sb-kqmacejxvulnltazvcyn-auth-token=..."
```

## 댓글 API

### GET /api/posts/:id/comments
댓글 목록 조회
```bash
curl http://localhost:3000/api/posts/550e8400-e29b-41d4-a716-446655440000/comments
```

### POST /api/posts/:id/comments
댓글 작성
```bash
curl -X POST http://localhost:3000/api/posts/550e8400-e29b-41d4-a716-446655440000/comments \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-kqmacejxvulnltazvcyn-auth-token=..." \
  -d '{
    "content": "좋은 글이네요!",
    "parent_id": null
  }'
```

## 검색 API

### GET /api/posts/search
게시글 검색 (최소 2글자)
```bash
curl "http://localhost:3000/api/posts/search?q=javascript"
```

## 테스트 시 주의사항

1. **UUID 형식**: 게시글 ID는 실제 존재하는 UUID를 사용해야 합니다
   - 예: `550e8400-e29b-41d4-a716-446655440000`
   - `[id]`와 같은 플레이스홀더는 사용할 수 없습니다

2. **인증 토큰**: 인증이 필요한 API는 유효한 쿠키를 포함해야 합니다
   - 브라우저에서 로그인 후 개발자 도구에서 쿠키 확인
   - `sb-kqmacejxvulnltazvcyn-auth-token` 쿠키 값 복사

3. **Content-Type**: POST/PUT 요청 시 반드시 설정
   ```
   Content-Type: application/json
   ```

4. **검색어**: 검색 API는 최소 2글자 이상의 검색어 필요

## 실제 테스트 예제

### 1. 먼저 게시글 목록을 조회하여 실제 ID 확인
```bash
curl http://localhost:3000/api/posts?limit=1
```

### 2. 응답에서 게시글 ID 확인
```json
{
  "posts": [{
    "id": "실제-uuid-값",
    ...
  }]
}
```

### 3. 해당 ID로 상세 조회
```bash
curl http://localhost:3000/api/posts/실제-uuid-값
```