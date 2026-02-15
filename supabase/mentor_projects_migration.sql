-- Migration: Add mentor_feedback_enabled to projects
-- Run this in your Supabase SQL Editor

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS mentor_feedback_enabled BOOLEAN DEFAULT false;
