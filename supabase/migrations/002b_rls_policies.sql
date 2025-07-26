-- 002_rls_policies.sql
-- Row Level Security (RLS) 정책 설정

-- =================================================================
-- 1. RLS 활성화
-- =================================================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
-- post_activities table doesn't exist in schema, skipping
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
-- join_requests table doesn't exist in schema, skipping
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- 2. 프로필 정책
-- =================================================================

-- 모든 사용자가 프로필 조회 가능
CREATE POLICY "profiles_select_all" ON profiles
FOR SELECT USING (true);

-- 본인 프로필만 수정 가능
CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- 회원가입 시 프로필 생성 가능
CREATE POLICY "profiles_insert_own" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- =================================================================
-- 3. 게시판 타입 및 카테고리 정책
-- =================================================================

-- 모든 사용자가 게시판 타입 조회 가능
CREATE POLICY "board_types_select_all" ON board_types
FOR SELECT USING (is_active = true);

-- 관리자만 게시판 타입 관리 가능
CREATE POLICY "board_types_admin_all" ON board_types
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 모든 사용자가 활성 카테고리 조회 가능
CREATE POLICY "categories_select_active" ON categories
FOR SELECT USING (is_active = true);

-- 관리자만 카테고리 관리 가능
CREATE POLICY "categories_admin_all" ON categories
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =================================================================
-- 4. 태그 정책
-- =================================================================

-- 모든 사용자가 태그 조회 가능
CREATE POLICY "tags_select_all" ON tags
FOR SELECT USING (true);

-- 로그인한 사용자는 태그 생성 가능
CREATE POLICY "tags_insert_authenticated" ON tags
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 관리자만 태그 수정/삭제 가능
CREATE POLICY "tags_admin_update_delete" ON tags
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "tags_admin_delete" ON tags
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =================================================================
-- 5. 게시글 정책
-- =================================================================

-- 게시된 글은 모두 조회 가능
CREATE POLICY "posts_select_published" ON posts
FOR SELECT USING (status = 'published');

-- 작성자는 자신의 모든 글 조회 가능
CREATE POLICY "posts_select_own" ON posts
FOR SELECT USING (auth.uid() = author_id);

-- 관리자는 모든 글 조회 가능
CREATE POLICY "posts_select_admin" ON posts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 로그인한 사용자는 게시글 작성 가능
CREATE POLICY "posts_insert_authenticated" ON posts
FOR INSERT WITH CHECK (auth.uid() = author_id);

-- 작성자는 자신의 글 수정 가능
CREATE POLICY "posts_update_own" ON posts
FOR UPDATE USING (auth.uid() = author_id);

-- 관리자는 모든 글 수정 가능 (승인/거부 등)
CREATE POLICY "posts_update_admin" ON posts
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- 작성자는 자신의 글 삭제 가능 (draft, rejected 상태만)
CREATE POLICY "posts_delete_own_draft" ON posts
FOR DELETE USING (
    auth.uid() = author_id 
    AND status IN ('draft', 'rejected')
);

-- 관리자는 모든 글 삭제 가능
CREATE POLICY "posts_delete_admin" ON posts
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =================================================================
-- 6. 댓글 정책
-- =================================================================

-- 게시된 글의 댓글은 모두 조회 가능
CREATE POLICY "post_comments_select_all" ON post_comments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM posts 
        WHERE posts.id = post_comments.post_id 
        AND posts.status = 'published'
    )
);

-- 로그인한 사용자는 댓글 작성 가능
CREATE POLICY "post_comments_insert_authenticated" ON post_comments
FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
        SELECT 1 FROM posts 
        WHERE posts.id = post_comments.post_id 
        AND posts.status = 'published'
    )
);

-- 작성자는 자신의 댓글 수정 가능
CREATE POLICY "post_comments_update_own" ON post_comments
FOR UPDATE USING (auth.uid() = author_id);

-- 작성자는 자신의 댓글 삭제 가능 (소프트 삭제)
CREATE POLICY "post_comments_delete_own" ON post_comments
FOR DELETE USING (auth.uid() = author_id);

-- 관리자는 모든 댓글 관리 가능
CREATE POLICY "post_comments_admin_all" ON post_comments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =================================================================
-- 7. 좋아요 정책
-- =================================================================

-- 모든 사용자가 좋아요 조회 가능
CREATE POLICY "post_likes_select_all" ON post_likes
FOR SELECT USING (true);

-- 로그인한 사용자는 좋아요 추가 가능
CREATE POLICY "post_likes_insert_authenticated" ON post_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 좋아요만 삭제 가능
CREATE POLICY "post_likes_delete_own" ON post_likes
FOR DELETE USING (auth.uid() = user_id);

-- 댓글 좋아요도 동일한 정책 적용
CREATE POLICY "comment_likes_select_all" ON comment_likes
FOR SELECT USING (true);

CREATE POLICY "comment_likes_insert_authenticated" ON comment_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comment_likes_delete_own" ON comment_likes
FOR DELETE USING (auth.uid() = user_id);

-- =================================================================
-- 8. 북마크 정책
-- =================================================================

-- 본인 북마크만 조회 가능
CREATE POLICY "post_bookmarks_select_own" ON post_bookmarks
FOR SELECT USING (auth.uid() = user_id);

-- 로그인한 사용자는 북마크 추가 가능
CREATE POLICY "post_bookmarks_insert_authenticated" ON post_bookmarks
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 본인 북마크만 삭제 가능
CREATE POLICY "post_bookmarks_delete_own" ON post_bookmarks
FOR DELETE USING (auth.uid() = user_id);

-- =================================================================
-- 9. 커뮤니티 정책
-- =================================================================

-- 공개 커뮤니티는 모두 조회 가능
CREATE POLICY "communities_select_public" ON communities
FOR SELECT USING (visibility = 'public');

-- 비공개 커뮤니티는 멤버만 조회 가능
CREATE POLICY "communities_select_private_members" ON communities
FOR SELECT USING (
    visibility = 'private' 
    AND EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_members.community_id = communities.id 
        AND community_members.user_id = auth.uid()
    )
);

-- 로그인한 사용자는 커뮤니티 생성 가능
CREATE POLICY "communities_insert_authenticated" ON communities
FOR INSERT WITH CHECK (auth.uid() = created_by);

-- 커뮤니티 생성자는 수정 가능
CREATE POLICY "communities_update_owner" ON communities
FOR UPDATE USING (auth.uid() = created_by);

-- 커뮤니티 생성자는 삭제 가능
CREATE POLICY "communities_delete_owner" ON communities
FOR DELETE USING (auth.uid() = created_by);

-- =================================================================
-- 10. 커뮤니티 멤버 정책
-- =================================================================

-- 커뮤니티 멤버는 멤버 목록 조회 가능
CREATE POLICY "community_members_select_members" ON community_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM community_members cm
        WHERE cm.community_id = community_members.community_id 
        AND cm.user_id = auth.uid()
    )
);

-- 커뮤니티 가입 가능 (공개 커뮤니티)
CREATE POLICY "community_members_insert_public" ON community_members
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM communities 
        WHERE communities.id = community_members.community_id 
        AND communities.visibility = 'public'
    )
);

-- 본인은 탈퇴 가능
CREATE POLICY "community_members_delete_self" ON community_members
FOR DELETE USING (auth.uid() = user_id AND role != 'owner');

-- 커뮤니티 소유자는 멤버 관리 가능
CREATE POLICY "community_members_owner_manage" ON community_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM communities 
        WHERE communities.id = community_members.community_id 
        AND communities.created_by = auth.uid()
    )
);

-- =================================================================
-- 11. 커뮤니티 채팅 정책
-- =================================================================

-- 커뮤니티 멤버는 메시지 조회 가능
CREATE POLICY "community_messages_select_members" ON community_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_members.community_id = community_messages.community_id 
        AND community_members.user_id = auth.uid()
    )
);

-- 커뮤니티 멤버는 메시지 작성 가능
CREATE POLICY "community_messages_insert_members" ON community_messages
FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_members.community_id = community_messages.community_id 
        AND community_members.user_id = auth.uid()
    )
);

-- 작성자는 자신의 메시지 수정 가능
CREATE POLICY "community_messages_update_own" ON community_messages
FOR UPDATE USING (auth.uid() = user_id);

-- 작성자는 자신의 메시지 삭제 가능
CREATE POLICY "community_messages_delete_own" ON community_messages
FOR DELETE USING (auth.uid() = user_id);

-- =================================================================
-- 12. 커뮤니티 메모 정책
-- =================================================================

-- 커뮤니티 멤버는 메모 조회 가능
CREATE POLICY "community_memos_select_members" ON community_memos
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_members.community_id = community_memos.community_id 
        AND community_members.user_id = auth.uid()
    )
);

-- 커뮤니티 멤버는 메모 작성 가능
CREATE POLICY "community_memos_insert_members" ON community_memos
FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_members.community_id = community_memos.community_id 
        AND community_members.user_id = auth.uid()
    )
);

-- 작성자는 자신의 메모 수정 가능
CREATE POLICY "community_memos_update_own" ON community_memos
FOR UPDATE USING (auth.uid() = author_id);

-- 작성자는 자신의 메모 삭제 가능
CREATE POLICY "community_memos_delete_own" ON community_memos
FOR DELETE USING (auth.uid() = author_id);

-- =================================================================
-- 13. 커뮤니티 파일 정책
-- =================================================================

-- 커뮤니티 멤버는 파일 목록 조회 가능
CREATE POLICY "community_files_select_members" ON community_files
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_members.community_id = community_files.community_id 
        AND community_members.user_id = auth.uid()
    )
);

-- 커뮤니티 멤버는 파일 업로드 가능
CREATE POLICY "community_files_insert_members" ON community_files
FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_members.community_id = community_files.community_id 
        AND community_members.user_id = auth.uid()
    )
);

-- 업로더는 자신의 파일 삭제 가능
CREATE POLICY "community_files_delete_own" ON community_files
FOR DELETE USING (auth.uid() = uploaded_by);

-- =================================================================
-- 14. 알림 정책
-- =================================================================

-- 본인 알림만 조회 가능
CREATE POLICY "notifications_select_own" ON notifications
FOR SELECT USING (auth.uid() = user_id);

-- 시스템이 알림 생성 (트리거로 처리)
-- INSERT 정책은 설정하지 않음

-- 본인 알림만 수정 가능 (읽음 처리)
CREATE POLICY "notifications_update_own" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- 본인 알림만 삭제 가능
CREATE POLICY "notifications_delete_own" ON notifications
FOR DELETE USING (auth.uid() = user_id);

-- =================================================================
-- 15. 메시지 정책
-- =================================================================

-- 발신자 또는 수신자만 메시지 조회 가능
CREATE POLICY "messages_select_own" ON messages
FOR SELECT USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id
);

-- 로그인한 사용자는 메시지 발송 가능
CREATE POLICY "messages_insert_authenticated" ON messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 수신자는 읽음 처리 가능
CREATE POLICY "messages_update_receiver" ON messages
FOR UPDATE USING (auth.uid() = receiver_id);

-- 발신자 또는 수신자는 삭제 가능
CREATE POLICY "messages_delete_own" ON messages
FOR DELETE USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id
);

-- =================================================================
-- RLS 정책 설정 완료
-- =================================================================