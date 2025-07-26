-- 002_cleanup_invalid_rls.sql
-- Clean up invalid RLS references before applying new policies

-- =================================================================
-- Remove RLS from non-existent tables
-- =================================================================

-- These commands will only execute if the tables exist
-- This prevents errors if tables don't exist

DO $$ 
BEGIN
    -- Check and handle post_activities table
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'post_activities'
    ) THEN
        -- If it exists but we don't need it, drop RLS
        EXECUTE 'ALTER TABLE post_activities DISABLE ROW LEVEL SECURITY';
    END IF;
    
    -- Check and handle join_requests table
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'join_requests'
    ) THEN
        -- If it exists but we don't need it, drop RLS
        EXECUTE 'ALTER TABLE join_requests DISABLE ROW LEVEL SECURITY';
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        -- Tables don't exist, which is fine
        NULL;
    WHEN OTHERS THEN
        -- Log but don't fail the migration
        RAISE NOTICE 'Error cleaning up RLS: %', SQLERRM;
END $$;

-- =================================================================
-- Complete - Invalid RLS references cleaned up
-- =================================================================