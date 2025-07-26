-- 003_fix_admin_rls_policies.sql
-- Fix RLS policies for admin operations

-- =================================================================
-- 1. Enable RLS for admin_logs table
-- =================================================================

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- 2. Admin logs policies
-- =================================================================

-- Only admins can view admin logs
CREATE POLICY "admin_logs_select_admin" ON admin_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Only admins can insert admin logs
CREATE POLICY "admin_logs_insert_admin" ON admin_logs
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Admin logs cannot be updated or deleted
-- No UPDATE or DELETE policies needed

-- =================================================================
-- 3. Fix board_types policies for admin operations
-- =================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "board_types_select_all" ON board_types;

-- Allow all users to see board types (active or not for admins)
CREATE POLICY "board_types_select_all" ON board_types
FOR SELECT USING (
    is_active = true 
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Ensure admin policy exists for other operations
DROP POLICY IF EXISTS "board_types_admin_all" ON board_types;

CREATE POLICY "board_types_admin_manage" ON board_types
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =================================================================
-- 4. Fix categories policies for admin operations
-- =================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "categories_select_active" ON categories;

-- Allow all users to see active categories, admins see all
CREATE POLICY "categories_select_all" ON categories
FOR SELECT USING (
    is_active = true 
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Ensure admin policy exists for other operations
DROP POLICY IF EXISTS "categories_admin_all" ON categories;

CREATE POLICY "categories_admin_manage" ON categories
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =================================================================
-- 5. Fix posts policies for admin insert operations
-- =================================================================

-- Add specific admin insert policy
CREATE POLICY "posts_insert_admin" ON posts
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =================================================================
-- 6. Fix community_members infinite recursion
-- =================================================================

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "community_members_select_members" ON community_members;

-- Create a non-recursive policy using a different approach
CREATE POLICY "community_members_select_members" ON community_members
FOR SELECT USING (
    -- User can see members of communities they belong to
    community_id IN (
        SELECT community_id 
        FROM community_members 
        WHERE user_id = auth.uid()
    )
    -- Or if they're an admin
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =================================================================
-- 7. Add missing policies for tables referenced in schema but not in RLS
-- =================================================================

-- First, check if tables exist and drop non-existent table references from RLS
DO $$ 
BEGIN
    -- These tables don't exist in schema, so skip their RLS if referenced
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'post_activities') THEN
        ALTER TABLE post_activities DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'join_requests') THEN
        ALTER TABLE join_requests DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Enable RLS for missing tables that actually exist
ALTER TABLE post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_join_requests ENABLE ROW LEVEL SECURITY;

-- Post attachments policies
CREATE POLICY "post_attachments_select_all" ON post_attachments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM posts 
        WHERE posts.id = post_attachments.post_id 
        AND posts.status = 'published'
    )
    OR EXISTS (
        SELECT 1 FROM posts 
        WHERE posts.id = post_attachments.post_id 
        AND posts.author_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "post_attachments_insert_auth" ON post_attachments
FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
        SELECT 1 FROM posts 
        WHERE posts.id = post_attachments.post_id 
        AND posts.author_id = auth.uid()
    )
);

CREATE POLICY "post_attachments_delete_own" ON post_attachments
FOR DELETE USING (
    auth.uid() = uploaded_by
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Post approvals policies (admin only)
CREATE POLICY "post_approvals_admin_all" ON post_approvals
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Community join requests policies
CREATE POLICY "community_join_requests_select_own" ON community_join_requests
FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM communities 
        WHERE communities.id = community_join_requests.community_id 
        AND communities.created_by = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "community_join_requests_insert_auth" ON community_join_requests
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "community_join_requests_update_owner" ON community_join_requests
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM communities 
        WHERE communities.id = community_join_requests.community_id 
        AND communities.created_by = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "community_join_requests_delete_own" ON community_join_requests
FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM communities 
        WHERE communities.id = community_join_requests.community_id 
        AND communities.created_by = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- =================================================================
-- 8. Add helper function for admin check (optional but useful)
-- =================================================================

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

-- =================================================================
-- Complete - Admin RLS policies fixed
-- =================================================================