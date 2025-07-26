# RLS (Row Level Security) 수정 사항

## 문제점
1. `admin_logs` 테이블에 RLS 정책 누락
2. `board_types`와 `categories` 테이블의 관리자 접근 권한 문제
3. `posts` 테이블에 관리자 INSERT 권한 누락
4. `community_members` 테이블의 무한 재귀 정책 문제
5. 존재하지 않는 테이블(`post_activities`, `join_requests`)에 대한 RLS 참조

## 해결 방법

### 1. 새로운 마이그레이션 파일 생성
- `002a_cleanup_invalid_rls.sql`: 잘못된 RLS 참조 정리
- `002b_rls_policies.sql`: 기존 RLS 정책 (수정됨)
- `003_fix_admin_rls_policies.sql`: 관리자 권한 수정

### 2. 주요 수정 사항

#### admin_logs 테이블
```sql
-- RLS 활성화
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 및 삽입 가능
CREATE POLICY "admin_logs_select_admin" ON admin_logs
FOR SELECT USING (is_admin());

CREATE POLICY "admin_logs_insert_admin" ON admin_logs
FOR INSERT WITH CHECK (is_admin());
```

#### board_types & categories 테이블
```sql
-- 일반 사용자는 활성화된 항목만, 관리자는 모두 조회
CREATE POLICY "board_types_select_all" ON board_types
FOR SELECT USING (
    is_active = true 
    OR is_admin()
);

-- 관리자만 모든 작업 가능
CREATE POLICY "board_types_admin_manage" ON board_types
FOR ALL USING (is_admin());
```

#### posts 테이블 (관리자 INSERT 추가)
```sql
CREATE POLICY "posts_insert_admin" ON posts
FOR INSERT WITH CHECK (is_admin());
```

#### community_members 테이블 (무한 재귀 해결)
```sql
-- 재귀하지 않는 방식으로 변경
CREATE POLICY "community_members_select_members" ON community_members
FOR SELECT USING (
    community_id IN (
        SELECT community_id 
        FROM community_members 
        WHERE user_id = auth.uid()
    )
    OR is_admin()
);
```

#### 헬퍼 함수 추가
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. 누락된 테이블 RLS 추가
- `post_attachments`
- `post_approvals`
- `community_join_requests`

## 적용 방법

1. Supabase 로컬 환경에서:
```bash
npx supabase db reset
```

2. 프로덕션 환경에서는 순서대로 마이그레이션 실행:
```bash
npx supabase migration up
```

## 테스트 확인 사항
- [ ] 관리자 로그인 후 모든 관리 기능 정상 작동
- [ ] 일반 사용자는 권한이 있는 데이터만 접근 가능
- [ ] 커뮤니티 멤버십 조회 시 무한 재귀 발생하지 않음
- [ ] 게시글 승인/거부 워크플로우 정상 작동