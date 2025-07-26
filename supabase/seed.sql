-- 개발자 커뮤니티 플랫폼 - 초기 데이터 생성
-- HTML 회의 내용 기반 완전 새로운 스키마

-- 🚨 AI 주의사항 - 초기 데이터:
-- ❌ free_posts, knowledge_posts 테이블에 데이터 삽입 없음!
-- ✅ 모든 게시글은 posts 테이블에 삽입
-- 📌 board_types의 slug가 실제 사용되는 값:
--   - 'knowledge' → 지식공유 (requires_approval: true)
--   - 'forum' → 자유게시판 (requires_approval: false)
-- ⚠️ 주의: 'free' slug는 없음! 'forum'이 자유게시판!

-- 1. 게시판 타입 생성
INSERT INTO board_types (name, slug, description, icon, requires_approval, is_active, order_index) VALUES
  ('지식 공유', 'knowledge', '개발 관련 지식과 경험을 공유하는 게시판', '📚', true, true, 1),
  ('자유게시판', 'forum', '자유롭게 이야기할 수 있는 게시판', '💬', false, true, 2),
  ('질문&답변', 'qna', '개발 관련 질문과 답변', '❓', false, true, 3),
  ('프로젝트 쇼케이스', 'showcase', '개발한 프로젝트를 공유하는 게시판', '🚀', true, true, 4);

-- 2. 카테고리 생성
-- 지식 공유 게시판 카테고리
INSERT INTO categories (board_type_id, name, slug, description, color, icon, is_active, order_index) VALUES
  ((SELECT id FROM board_types WHERE slug = 'knowledge'), 'Frontend', 'frontend', 'React, Vue, Angular 등 프론트엔드 기술', '#3B82F6', '🎨', true, 1),
  ((SELECT id FROM board_types WHERE slug = 'knowledge'), 'Backend', 'backend', 'Node.js, Python, Java 등 백엔드 기술', '#10B981', '⚙️', true, 2),
  ((SELECT id FROM board_types WHERE slug = 'knowledge'), 'DevOps', 'devops', 'CI/CD, Docker, 클라우드 등', '#8B5CF6', '🔧', true, 3),
  ((SELECT id FROM board_types WHERE slug = 'knowledge'), 'Mobile', 'mobile', '모바일 앱 개발', '#F59E0B', '📱', true, 4),
  ((SELECT id FROM board_types WHERE slug = 'knowledge'), 'Database', 'database', '데이터베이스 관련', '#EF4444', '🗄️', true, 5);

-- 자유게시판 카테고리
INSERT INTO categories (board_type_id, name, slug, description, color, icon, is_active, order_index) VALUES
  ((SELECT id FROM board_types WHERE slug = 'forum'), '일상', 'daily', '개발자의 일상 이야기', '#6B7280', '☕', true, 1),
  ((SELECT id FROM board_types WHERE slug = 'forum'), '커리어', 'career', '커리어 관련 이야기', '#059669', '💼', true, 2),
  ((SELECT id FROM board_types WHERE slug = 'forum'), '스터디', 'study', '스터디 모집 및 후기', '#DC2626', '📖', true, 3),
  ((SELECT id FROM board_types WHERE slug = 'forum'), '리뷰', 'review', '기술 및 도구 리뷰', '#7C3AED', '⭐', true, 4);

-- 질문&답변 카테고리
INSERT INTO categories (board_type_id, name, slug, description, color, icon, is_active, order_index) VALUES
  ((SELECT id FROM board_types WHERE slug = 'qna'), '프로그래밍', 'programming', '프로그래밍 언어 관련 질문', '#1F2937', '💻', true, 1),
  ((SELECT id FROM board_types WHERE slug = 'qna'), '프레임워크', 'framework', '프레임워크 사용법 질문', '#374151', '🛠️', true, 2),
  ((SELECT id FROM board_types WHERE slug = 'qna'), '버그&오류', 'bug', '버그 및 오류 해결', '#B91C1C', '🐛', true, 3),
  ((SELECT id FROM board_types WHERE slug = 'qna'), '아키텍처', 'architecture', '시스템 설계 및 아키텍처', '#1E40AF', '🏗️', true, 4);

-- 프로젝트 쇼케이스 카테고리
INSERT INTO categories (board_type_id, name, slug, description, color, icon, is_active, order_index) VALUES
  ((SELECT id FROM board_types WHERE slug = 'showcase'), '웹 프로젝트', 'web', '웹사이트 및 웹앱', '#2563EB', '🌐', true, 1),
  ((SELECT id FROM board_types WHERE slug = 'showcase'), '모바일 앱', 'mobile-app', '모바일 애플리케이션', '#16A34A', '📱', true, 2),
  ((SELECT id FROM board_types WHERE slug = 'showcase'), '오픈소스', 'opensource', '오픈소스 프로젝트', '#CA8A04', '🔓', true, 3),
  ((SELECT id FROM board_types WHERE slug = 'showcase'), '게임', 'game', '게임 프로젝트', '#9333EA', '🎮', true, 4);

-- 3. 인기 태그 생성
INSERT INTO tags (name, slug, description, usage_count) VALUES
  ('React', 'react', 'React.js 프론트엔드 라이브러리', 0),
  ('Vue', 'vue', 'Vue.js 프론트엔드 프레임워크', 0),
  ('Angular', 'angular', 'Angular 프론트엔드 프레임워크', 0),
  ('Node.js', 'nodejs', 'Node.js 백엔드 플랫폼', 0),
  ('Python', 'python', 'Python 프로그래밍 언어', 0),
  ('Java', 'java', 'Java 프로그래밍 언어', 0),
  ('JavaScript', 'javascript', 'JavaScript 프로그래밍 언어', 0),
  ('TypeScript', 'typescript', 'TypeScript 프로그래밍 언어', 0),
  ('Docker', 'docker', '컨테이너화 플랫폼', 0),
  ('AWS', 'aws', 'Amazon Web Services', 0),
  ('MongoDB', 'mongodb', 'NoSQL 데이터베이스', 0),
  ('PostgreSQL', 'postgresql', 'SQL 데이터베이스', 0),
  ('Git', 'git', '버전 관리 시스템', 0),
  ('CSS', 'css', 'Cascading Style Sheets', 0),
  ('HTML', 'html', 'HyperText Markup Language', 0);

-- 4. 샘플 커뮤니티 생성 (테스트용)
INSERT INTO communities (name, slug, description, visibility, max_members, tags) VALUES
  ('React 개발자 모임', 'react-developers', 'React 개발자들이 모여 지식을 공유하는 커뮤니티', 'public', 50, ARRAY['React', 'JavaScript', 'Frontend']),
  ('백엔드 마스터즈', 'backend-masters', '백엔드 개발 전문가들의 비공개 모임', 'private', 20, ARRAY['Backend', 'API', 'Database']),
  ('주니어 개발자 스터디', 'junior-study', '주니어 개발자들을 위한 스터디 그룹', 'public', 30, ARRAY['Study', 'Beginner', 'Career']);

-- 테스트용 관리자 계정 설정 안내
-- 실제 사용자를 생성한 후 아래 명령어로 관리자 권한 부여:
-- UPDATE profiles SET role = 'admin' WHERE username = 'your_admin_username';

COMMENT ON TABLE board_types IS '게시판 타입 (지식공유, 자유게시판 등)';
COMMENT ON TABLE categories IS '카테고리 (Frontend, Backend 등)';
COMMENT ON TABLE tags IS '태그 시스템';
COMMENT ON TABLE communities IS '소규모 커뮤니티';