-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Blog categories policies
CREATE POLICY "Blog categories are viewable by everyone" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories" ON blog_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Blog posts policies
CREATE POLICY "Published posts are viewable by everyone" ON blog_posts
  FOR SELECT USING (status = 'published' OR author_id = auth.uid());

CREATE POLICY "Authors can create posts" ON blog_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authors can update own posts" ON blog_posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts" ON blog_posts
  FOR DELETE USING (auth.uid() = author_id);

-- Blog comments policies
CREATE POLICY "Comments are viewable by everyone" ON blog_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON blog_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments" ON blog_comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments" ON blog_comments
  FOR DELETE USING (auth.uid() = author_id);

-- Team rotations policies
CREATE POLICY "Rotations are viewable by authenticated users" ON team_rotations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage rotations" ON team_rotations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Teams policies
CREATE POLICY "Teams are viewable by members" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

-- Team members policies
CREATE POLICY "Team members are viewable by team members" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

-- Team messages policies
CREATE POLICY "Team messages are viewable by team members" ON team_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_messages.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create messages" ON team_messages
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_messages.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Team memos policies
CREATE POLICY "Team memos are viewable by team members" ON team_memos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_memos.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create memos" ON team_memos
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_memos.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Memo authors can update own memos" ON team_memos
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Memo authors can delete own memos" ON team_memos
  FOR DELETE USING (auth.uid() = author_id);

-- Tasks policies
CREATE POLICY "Tasks are viewable by team members" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can update tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Task comments policies
CREATE POLICY "Task comments are viewable by team members" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = task_comments.task_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create task comments" ON task_comments
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM tasks
      JOIN team_members ON team_members.team_id = tasks.team_id
      WHERE tasks.id = task_comments.task_id
      AND team_members.user_id = auth.uid()
    )
  );