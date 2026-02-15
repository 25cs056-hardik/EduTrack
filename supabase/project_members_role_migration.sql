-- Migration: Add role column to project_members
-- Run this in your Supabase SQL Editor

-- 1. Add role column
ALTER TABLE public.project_members
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('student', 'mentor')) DEFAULT 'student';

-- 2. Backfill existing rows
UPDATE public.project_members SET role = 'student' WHERE role IS NULL;

-- 3. Drop the old over-broad SELECT policy if it exists
DROP POLICY IF EXISTS "Project members viewable by everyone" ON public.project_members;

-- 4. New RLS policies for project_members
-- Users can read their own assignments
CREATE POLICY "Users can read their project assignments"
  ON public.project_members FOR SELECT
  USING (user_id = auth.uid());

-- Mentors/Admins can read all project_members (needed for admin dashboard)
CREATE POLICY "Mentors and admins can read all project members"
  ON public.project_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
  );

-- Students can insert members into their own projects
CREATE POLICY "Students can add members to their projects"
  ON public.project_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
  );
