# API 테스트 데이터

## 생성된 테스트 데이터

### 게시글 (posts)
- **ID: 550e8400-e29b-41d4-a716-446655440000**
  - 제목: API 테스트용 게시글 1
  - 상태: published (공개됨)
  - 카테고리: Frontend
  
- **ID: 550e8400-e29b-41d4-a716-446655440001**
  - 제목: API 테스트용 초안 게시글
  - 상태: draft (초안)
  - 카테고리: Backend
  
- **ID: 550e8400-e29b-41d4-a716-446655440002**
  - 제목: JavaScript 성능 최적화 팁
  - 상태: published (공개됨)
  - 카테고리: Frontend

### 댓글 (post_comments)
- **ID: 660e8400-e29b-41d4-a716-446655440000**
  - 게시글: 550e8400-e29b-41d4-a716-446655440000
  - 내용: 좋은 글이네요! 많은 도움이 되었습니다.
  
- **ID: 660e8400-e29b-41d4-a716-446655440001**
  - 게시글: 550e8400-e29b-41d4-a716-446655440000
  - 내용: 추가로 질문이 있는데, 이 부분은 어떻게 처리하나요?

### 좋아요 (post_likes)
- 게시글 550e8400-e29b-41d4-a716-446655440000에 좋아요 추가됨

## API 테스트 센터 업데이트 내역

1. **실제 데이터 사용**: API 테스트 센터가 이제 실제 존재하는 데이터 ID를 사용합니다.
   - 게시글 ID: `550e8400-e29b-41d4-a716-446655440000`
   - 댓글 ID: `660e8400-e29b-41d4-a716-446655440000`

2. **수정된 파일**: `src/app/admin/api-test-center/page.tsx`
   - 하드코딩된 'test-id-123' 대신 실제 데이터베이스의 ID 사용

## 테스트 방법

1. 브라우저에서 http://localhost:3000/admin/api-test-center 접속
2. 관리자 계정으로 로그인 (이미 로그인되어 있음)
3. 각 API 엔드포인트 테스트 실행
4. 이제 대부분의 API가 정상적으로 200 응답을 반환해야 함

## 주의사항

- 커뮤니티 관련 API는 실제 커뮤니티 데이터가 없어 여전히 실패할 수 있음
- 파일 업로드 등 특수한 경우는 별도 테스트 필요