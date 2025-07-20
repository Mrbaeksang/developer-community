-- Insert blog categories
INSERT INTO blog_categories (name, slug, description) VALUES
  ('AI 뉴스', 'ai-news', 'AI 관련 최신 뉴스와 동향'),
  ('개발 팁', 'dev-tips', '개발 생산성을 높이는 팁과 트릭'),
  ('프레임워크', 'frameworks', '프레임워크 가이드와 업데이트'),
  ('커리어', 'career', '개발자 커리어 관련 조언');

-- Note: 실제 데이터는 사용자가 회원가입한 후에 추가됩니다
-- 아래는 예시 쿼리입니다:

-- 샘플 팀 로테이션 (관리자가 생성)
-- INSERT INTO team_rotations (name, description, start_date, end_date, is_active) VALUES
--   ('1주차 로테이션', '첫 번째 팀 로테이션', '2025-01-20', '2025-01-26', true);

-- 샘플 팀 (관리자가 생성)
-- INSERT INTO teams (rotation_id, name, description) VALUES
--   ('[rotation_id]', '팀 알파', '1주차 팀 알파'),
--   ('[rotation_id]', '팀 베타', '1주차 팀 베타'),
--   ('[rotation_id]', '팀 감마', '1주차 팀 감마');