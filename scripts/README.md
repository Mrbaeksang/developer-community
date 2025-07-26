# Scripts 디렉토리 가이드

이 디렉토리에는 개발과 테스트를 위한 유틸리티 스크립트들이 포함되어 있습니다.

## 🛠️ 주요 스크립트

### 1. `test-all-apis.js`
- **용도**: 모든 API 엔드포인트 테스트
- **실행**: `node scripts/test-all-apis.js`
- **옵션**: 
  - `--category [name]`: 특정 카테고리만 테스트
  - `--implemented`: 구현된 API만 테스트
  - `--unimplemented`: 미구현 API만 확인

### 2. `generate-test-token.js`
- **용도**: API 테스트용 JWT 토큰 생성
- **실행**: `node scripts/generate-test-token.js`
- **출력**: 복사 가능한 Bearer 토큰

### 3. `create-test-users.js`
- **용도**: 테스트 사용자 자동 생성 (Service Role Key 필요)
- **실행**: `node scripts/create-test-users.js`
- **요구사항**: `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY` 설정

### 4. `create-users-via-signup.js`
- **용도**: 회원가입 API를 통한 사용자 생성
- **실행**: `node scripts/create-users-via-signup.js`

### 5. `system-check.js`
- **용도**: 시스템 상태 점검 (환경변수, DB 연결 등)
- **실행**: `node scripts/system-check.js`

## 👥 테스트 사용자 생성 가이드

### 방법 1: 회원가입 페이지 사용 (권장) ✅
1. 개발 서버 실행: `npm run dev`
2. http://localhost:3000/auth/signup 접속
3. 다음 계정들을 생성:

   **일반 사용자**:
   - 이메일: user@example.com
   - 비밀번호: User123456!
   - 사용자명: testuser
   - 표시 이름: 테스트 사용자

   **관리자**:
   - 이메일: admin@example.com
   - 비밀번호: Admin123456!
   - 사용자명: admin
   - 표시 이름: 관리자

4. 관리자 권한 부여 (SQL Editor에서 실행):
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'admin@example.com';
   ```

### 방법 2: Supabase 대시보드 사용
1. Supabase Dashboard → Authentication → Users
2. "Invite User" 또는 "Create User" 클릭
3. 이메일과 비밀번호 입력
4. "Auto Confirm User" 체크 (개발 환경)
5. SQL Editor에서 프로필 생성

### 방법 3: 스크립트 사용
```bash
# Service Role Key 필요
node scripts/create-test-users.js

# 또는 회원가입 API 사용
node scripts/create-users-via-signup.js
```

## ⚙️ 개발 환경 설정

### 이메일 인증 비활성화
Supabase Dashboard에서:
1. Authentication → Providers → Email
2. "Confirm email" 옵션 OFF
3. Save 클릭

### 비밀번호 요구사항
- 최소 6자 이상
- 대소문자, 숫자, 특수문자 포함 권장

## 🐛 문제 해결

### 로그인 문제
- 쿠키 초기화: http://localhost:3000/clear-cookies.html
- 시크릿 창에서 시도
- 개발 서버 재시작

### 프로필 생성 실패
1. Supabase Dashboard → Authentication → Users에서 사용자 ID 확인
2. SQL Editor에서 수동으로 프로필 삽입

### 권한 문제
- profiles 테이블의 role 컬럼 확인
- 'admin' 값이 정확히 설정되었는지 확인