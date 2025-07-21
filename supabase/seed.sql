-- 기본 카테고리 생성
INSERT INTO post_categories (name, slug, description, color) VALUES
  ('기술', 'tech', '기술 관련 게시글', '#3B82F6'),
  ('일상', 'daily', '일상 이야기', '#10B981'),
  ('질문', 'question', '궁금한 점을 물어보세요', '#F59E0B'),
  ('공지사항', 'notice', '중요한 공지사항', '#EF4444'),
  ('팁&노하우', 'tips', '유용한 팁과 노하우', '#8B5CF6');

-- 테스트용 관리자 계정 생성 (실제 운영시 제거)
-- 먼저 Supabase 대시보드에서 사용자를 생성한 후, 해당 사용자의 ID를 아래에 입력하세요
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_ADMIN_USER_ID';