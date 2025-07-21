-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Post categories policies (public read)
CREATE POLICY "Post categories are viewable by everyone"
  ON post_categories FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage categories"
  ON post_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Posts policies
CREATE POLICY "Approved posts are viewable by everyone"
  ON posts FOR SELECT
  USING (status = 'approved' OR author_id = auth.uid());

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all posts"
  ON posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Post comments policies
CREATE POLICY "Comments on approved posts are viewable"
  ON post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_comments.post_id
      AND posts.status = 'approved'
    )
  );

CREATE POLICY "Authenticated users can create comments"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON post_comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = author_id);

-- Post likes policies
CREATE POLICY "Post likes are viewable"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Communities policies
CREATE POLICY "Public communities are viewable by everyone"
  ON communities FOR SELECT
  USING (
    visibility = 'public' 
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = communities.id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Community admins can update"
  ON communities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = communities.id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'admin'
    )
  );

-- Community members policies
CREATE POLICY "Community members are viewable by community members"
  ON community_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm2
      WHERE cm2.community_id = community_members.community_id
      AND cm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join public communities"
  ON community_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_id
      AND communities.visibility = 'public'
    )
  );

CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Community admins can manage members"
  ON community_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM community_members cm2
      WHERE cm2.community_id = community_members.community_id
      AND cm2.user_id = auth.uid()
      AND cm2.role = 'admin'
    )
  );

-- Community messages policies
CREATE POLICY "Community members can view messages"
  ON community_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_messages.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can send messages"
  ON community_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_messages.community_id
      AND community_members.user_id = auth.uid()
    )
  );

-- Community memos policies
CREATE POLICY "Community members can view memos"
  ON community_memos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_memos.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can create memos"
  ON community_memos FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_memos.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Memo authors can update own memos"
  ON community_memos FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Memo authors can delete own memos"
  ON community_memos FOR DELETE
  USING (auth.uid() = author_id);

-- Community files policies
CREATE POLICY "Community members can view files"
  ON community_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_files.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can upload files"
  ON community_files FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_files.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "File uploaders can delete own files"
  ON community_files FOR DELETE
  USING (auth.uid() = uploaded_by);

-- Admin logs policies
CREATE POLICY "Only admins can view admin logs"
  ON admin_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert admin logs"
  ON admin_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = admin_id
      AND profiles.role = 'admin'
    )
  );