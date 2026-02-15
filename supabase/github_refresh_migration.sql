-- Migration: Add github_last_synced to projects
-- Run this in your Supabase SQL Editor

-- Ensure columns exist (using existing github_repo for URL store)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS github_data JSONB,
ADD COLUMN IF NOT EXISTS github_last_synced TIMESTAMP WITH TIME ZONE;
