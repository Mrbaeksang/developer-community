-- 001_complete_clean_schema.sql
-- 개발자 커뮤니티 플랫폼 - 완전 새로운 스키마 구성
-- HTML 회의 내용 기반으로 전체 재설계

-- 🚨 AI 주의사항 - 데이터베이스 구조:
-- ❌ free_posts, knowledge_posts 테이블 없음!
-- ✅ 모든 게시글은 posts 테이블 사용
-- 📌 board_type_id로 게시판 구분:
--   - 지식공유: 'cd49ac2e-5fc1-4b08-850a-61f95d29a885' (requires_approval: true)
--   - 자유게시판: '00f8f32b-faca-4947-94f5-812a0bb97c39' (requires_approval: false)
-- ⚠️ 주의: API 경로와 실제 테이블 구조가 다름!

-- =================================================================
-- 1. 기본 확장 기능 활성화
-- =================================================================

-- UUID 생성 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================
-- 2. ENUM 타입 정의
-- =================================================================

-- 사용자 역할
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- 게시글 상태
CREATE TYPE post_status AS ENUM ('draft', 'pending', 'published', 'rejected', 'archived');

-- 승인 액션
CREATE TYPE approval_action AS ENUM ('approved', 'rejected', 'pending');

-- 커뮤니티 공개 설정
CREATE TYPE community_visibility AS ENUM ('public', 'private');

-- 가입 요청 상태
CREATE TYPE join_request_status AS ENUM ('pending', 'approved', 'rejected');

-- 알림 타입
CREATE TYPE notification_type AS ENUM (
    'post_approved',        -- 게시글 승인됨
    'post_rejected',        -- 게시글 거부됨
    'comment_added',        -- 내 게시글에 댓글
    'comment_replied',      -- 내 댓글에 대댓글
    'post_liked',          -- 내 게시글 좋아요
    'comment_liked',       -- 내 댓글 좋아요
    'message_received',    -- 새 메시지 수신
    'community_invite',    -- 커뮤니티 초대
    'community_joined'     -- 커뮤니티 가입 승인
);

-- 커뮤니티 게시글 타입
CREATE TYPE community_post_type AS ENUM (
    'notice',              -- 공지사항
    'discussion',          -- 토론
    'question',            -- 질문
    'announcement'         -- 발표
);

-- =================================================================
-- 3. 핵심 테이블 생성
-- =================================================================

-- 사용자 프로필 테이블
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 게시판 타입 테이블 (지식공유, 자유게시판 등)
CREATE TABLE board_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    requires_approval BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 카테고리 테이블
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_type_id UUID NOT NULL REFERENCES board_types(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(board_type_id, slug)
);

-- 태그 테이블
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 게시글 테이블
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_type_id UUID NOT NULL REFERENCES board_types(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 게시글 내용
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    
    -- 작성자 정보 (비정규화)
    author_username TEXT,
    author_display_name TEXT,
    author_avatar_url TEXT,
    
    -- 메타 데이터
    featured_image TEXT,
    seo_title TEXT,
    seo_description TEXT,
    
    -- 상태 및 설정
    status post_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    
    -- 통계 (자동 계산)
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- 태그
    tags TEXT[] DEFAULT '{}',
    
    -- 시간 정보
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    published_at TIMESTAMPTZ
);

-- 게시글 댓글 테이블
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 댓글 내용
    content TEXT NOT NULL,
    
    -- 상태
    is_deleted BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    
    -- 시간 정보
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 게시글 좋아요 테이블
CREATE TABLE post_likes (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    PRIMARY KEY (post_id, user_id)
);

-- 댓글 좋아요 테이블
CREATE TABLE comment_likes (
    comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    PRIMARY KEY (comment_id, user_id)
);

-- 게시글 북마크 테이블
CREATE TABLE post_bookmarks (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    PRIMARY KEY (post_id, user_id)
);

-- 게시글 첨부파일 테이블
CREATE TABLE post_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 파일 정보
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    -- 이미지 정보
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    
    -- 순서
    order_index INTEGER DEFAULT 0,
    
    -- 제약사항
    max_file_size INTEGER DEFAULT 10485760,  -- 10MB
    allowed_mime_types TEXT[] DEFAULT ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'text/markdown'
    ],
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 게시글 승인 기록 테이블
CREATE TABLE post_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 승인 정보
    action approval_action NOT NULL,
    reason TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =================================================================
-- 4. 커뮤니티 시스템
-- =================================================================

-- 커뮤니티 테이블
CREATE TABLE communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    cover_image TEXT,
    
    -- 설정
    visibility community_visibility DEFAULT 'public',
    max_members INTEGER DEFAULT 100,
    
    -- 메타데이터
    tags TEXT[],
    
    -- 생성자 정보
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 커뮤니티 멤버 테이블
CREATE TABLE community_members (
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT now(),
    
    PRIMARY KEY (community_id, user_id)
);

-- 커뮤니티 가입 요청 테이블
CREATE TABLE community_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 요청 정보
    message TEXT,
    status join_request_status DEFAULT 'pending',
    
    -- 검토 정보
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 커뮤니티 메시지 테이블 (채팅)
CREATE TABLE community_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 메시지 내용
    content TEXT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 커뮤니티 메모 테이블
CREATE TABLE community_memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 메모 내용
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- 설정
    is_pinned BOOLEAN DEFAULT false,
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 커뮤니티 파일 테이블
CREATE TABLE community_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 파일 정보
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    category TEXT,
    
    -- 제약사항
    max_file_size INTEGER DEFAULT 10485760,  -- 10MB
    allowed_mime_types TEXT[] DEFAULT ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'text/markdown',
        'application/zip', 'application/x-zip-compressed'
    ],
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 커뮤니티 전용 게시글 테이블
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 게시글 내용
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    
    -- 분류 및 상태
    post_type community_post_type DEFAULT 'discussion',
    is_pinned BOOLEAN DEFAULT false,
    
    -- 통계 (자동 계산)
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- 태그 및 메타데이터
    tags TEXT[] DEFAULT '{}',
    
    -- 시간 정보
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 커뮤니티 게시글 댓글 테이블
CREATE TABLE community_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES community_post_comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 댓글 내용
    content TEXT NOT NULL,
    
    -- 상태
    is_deleted BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    
    -- 시간 정보
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 커뮤니티 게시글 좋아요 테이블
CREATE TABLE community_post_likes (
    community_post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    PRIMARY KEY (community_post_id, user_id)
);

-- 커뮤니티 댓글 좋아요 테이블
CREATE TABLE community_comment_likes (
    comment_id UUID NOT NULL REFERENCES community_post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    PRIMARY KEY (comment_id, user_id)
);

-- =================================================================
-- 5. 메시징 및 알림 시스템
-- =================================================================

-- 직접 메시지 테이블
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 메시지 내용
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    
    -- 대화 스레드
    thread_id UUID,
    
    -- 메타 데이터
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 알림 테이블
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 알림 내용
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    
    -- 관련 객체
    related_id UUID,
    related_type TEXT,
    
    -- 상태
    is_read BOOLEAN DEFAULT false,
    
    -- 메타 데이터
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =================================================================
-- 6. 관리자 시스템
-- =================================================================

-- 관리자 로그 테이블
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 액션 정보
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =================================================================
-- 7. 자동 업데이트 함수 및 트리거
-- =================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- updated_at 트리거 적용
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_types_updated_at BEFORE UPDATE ON board_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_memos_updated_at BEFORE UPDATE ON community_memos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_post_comments_updated_at BEFORE UPDATE ON community_post_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 게시글 좋아요 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- 게시글 좋아요 수 트리거 적용
CREATE TRIGGER update_post_like_count_trigger
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- 댓글 좋아요 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE post_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE post_comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- 댓글 좋아요 수 트리거 적용
CREATE TRIGGER update_comment_like_count_trigger
    AFTER INSERT OR DELETE ON comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

-- 게시글 댓글 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- 게시글 댓글 수 트리거 적용
CREATE TRIGGER update_post_comment_count_trigger
    AFTER INSERT OR DELETE ON post_comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- 커뮤니티 게시글 좋아요 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_community_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.community_post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts SET like_count = like_count - 1 WHERE id = OLD.community_post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- 커뮤니티 게시글 좋아요 수 트리거 적용
CREATE TRIGGER update_community_post_like_count_trigger
    AFTER INSERT OR DELETE ON community_post_likes
    FOR EACH ROW EXECUTE FUNCTION update_community_post_like_count();

-- 커뮤니티 게시글 댓글 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_community_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.community_post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_posts SET comment_count = comment_count - 1 WHERE id = OLD.community_post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- 커뮤니티 게시글 댓글 수 트리거 적용
CREATE TRIGGER update_community_post_comment_count_trigger
    AFTER INSERT OR DELETE ON community_post_comments
    FOR EACH ROW EXECUTE FUNCTION update_community_post_comment_count();

-- 커뮤니티 댓글 좋아요 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_community_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE community_post_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE community_post_comments SET like_count = like_count - 1 WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE 'plpgsql';

-- 커뮤니티 댓글 좋아요 수 트리거 적용
CREATE TRIGGER update_community_comment_like_count_trigger
    AFTER INSERT OR DELETE ON community_comment_likes
    FOR EACH ROW EXECUTE FUNCTION update_community_comment_like_count();

-- 태그 사용 횟수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS void AS $$
BEGIN
    UPDATE tags SET usage_count = (
        SELECT COUNT(*) FROM posts 
        WHERE tags @> ARRAY[tags.name]
    );
END;
$$ LANGUAGE 'plpgsql';

-- =================================================================
-- 8. 성능 최적화 인덱스
-- =================================================================

-- 사용자 관련 인덱스
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);

-- 게시글 관련 인덱스
CREATE INDEX idx_posts_board_type ON posts(board_type_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_featured ON posts(is_featured) WHERE is_featured = true;
CREATE INDEX idx_posts_pinned ON posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- 댓글 관련 인덱스
CREATE INDEX idx_post_comments_post ON post_comments(post_id);
CREATE INDEX idx_post_comments_author ON post_comments(author_id);
CREATE INDEX idx_post_comments_parent ON post_comments(parent_id) WHERE parent_id IS NOT NULL;

-- 좋아요 관련 인덱스
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);
CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON comment_likes(user_id);

-- 커뮤니티 관련 인덱스
CREATE INDEX idx_communities_slug ON communities(slug);
CREATE INDEX idx_communities_visibility ON communities(visibility);
CREATE INDEX idx_community_members_community ON community_members(community_id);
CREATE INDEX idx_community_members_user ON community_members(user_id);

-- 메시지 관련 인덱스
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_thread ON messages(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- 알림 관련 인덱스
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_related ON notifications(related_id, related_type);

-- 커뮤니티 게시글 관련 인덱스
CREATE INDEX idx_community_posts_community ON community_posts(community_id);
CREATE INDEX idx_community_posts_author ON community_posts(author_id);
CREATE INDEX idx_community_posts_type ON community_posts(post_type);
CREATE INDEX idx_community_posts_pinned ON community_posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_community_posts_created ON community_posts(created_at DESC);

-- 커뮤니티 댓글 관련 인덱스
CREATE INDEX idx_community_comments_post ON community_post_comments(community_post_id);
CREATE INDEX idx_community_comments_author ON community_post_comments(author_id);
CREATE INDEX idx_community_comments_parent ON community_post_comments(parent_id) WHERE parent_id IS NOT NULL;

-- =================================================================
-- 완료 - 개발자 커뮤니티 플랫폼 완전 새로운 스키마
-- =================================================================

COMMENT ON SCHEMA public IS '개발자 커뮤니티 플랫폼 - HTML 회의 기반 완전 새로운 스키마';