-- ============================================================
-- FEEDBACK SYSTEM MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. ALTER feedback table — add missing columns
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'addressed')) DEFAULT 'pending';

-- Rename 'comment' → 'message' (safe even if already renamed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'feedback' AND column_name = 'comment'
  ) THEN
    ALTER TABLE public.feedback RENAME COLUMN comment TO message;
  END IF;
END $$;

-- 2. CREATE feedback_replies table
CREATE TABLE IF NOT EXISTS public.feedback_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. ENABLE RLS on feedback_replies
ALTER TABLE public.feedback_replies ENABLE ROW LEVEL SECURITY;

-- 4. DROP old feedback policies
DROP POLICY IF EXISTS "Feedback viewable by project members" ON public.feedback;
DROP POLICY IF EXISTS "Mentors can add feedback" ON public.feedback;

-- 5. NEW feedback RLS policies

-- Mentors/Admins can INSERT feedback (must set themselves as mentor_id)
CREATE POLICY "Mentors/admins can insert feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (
    auth.uid() = mentor_id
    AND EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin')
    )
  );

-- Students can SELECT feedback addressed to them
CREATE POLICY "Students can view their feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = student_id);

-- Mentors/Admins can SELECT feedback they sent
CREATE POLICY "Mentors can view feedback they sent"
  ON public.feedback FOR SELECT
  USING (auth.uid() = mentor_id);

-- Admins can SELECT all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Students can UPDATE status of their feedback (to mark addressed)
CREATE POLICY "Students can update feedback status"
  ON public.feedback FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- 6. feedback_replies RLS policies

-- Users involved in the feedback can INSERT replies
CREATE POLICY "Involved users can insert replies"
  ON public.feedback_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.feedback
      WHERE id = feedback_id
        AND (student_id = auth.uid() OR mentor_id = auth.uid())
    )
  );

-- Users involved in the feedback can SELECT replies
CREATE POLICY "Involved users can view replies"
  ON public.feedback_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.feedback
      WHERE id = feedback_id
        AND (student_id = auth.uid() OR mentor_id = auth.uid())
    )
  );

-- Admins can view all replies
CREATE POLICY "Admins can view all replies"
  ON public.feedback_replies FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert replies on any feedback
CREATE POLICY "Admins can insert replies"
  ON public.feedback_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Enable realtime for feedback_replies
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_replies;
