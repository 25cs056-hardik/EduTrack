-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (Extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('student', 'mentor', 'admin')) NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- PROJECTS TABLE
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    objectives TEXT,
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- PROJECT MEMBERS TABLE (Many-to-Many Relationship)
CREATE TABLE public.project_members (
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    PRIMARY KEY (project_id, user_id)
);

-- TASKS TABLE
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('todo', 'in_progress', 'completed')) DEFAULT 'todo',
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- FEEDBACK TABLE
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- GITHUB REPOS TABLE
CREATE TABLE public.github_repos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    repo_owner TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    total_commits INTEGER DEFAULT 0,
    contributors JSONB DEFAULT '[]'::jsonb,
    last_synced TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_repos ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Users:
-- Everyone can read user profiles (needed for member lists)
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Projects:
-- Admins have full access
CREATE POLICY "Admins have full access to projects" ON public.projects FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
-- Mentors can view all projects (simplified for hackathon, or restrict to created_by)
CREATE POLICY "Mentors can view all projects" ON public.projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);
-- Students can view projects they are members of
CREATE POLICY "Students can view assigned projects" ON public.projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
);
-- Mentors can create projects
CREATE POLICY "Mentors can create projects" ON public.projects FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);


-- Project Members:
-- Viewable by everyone (internal team visibility)
CREATE POLICY "Project members viewable by everyone" ON public.project_members FOR SELECT USING (true);
-- Mentors/Admins can manage members
CREATE POLICY "Mentors can manage members" ON public.project_members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);

-- Tasks:
-- Viewable by project members and mentors/admins
CREATE POLICY "Tasks viewable by project members and mentors" ON public.tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = tasks.project_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);
-- Students can update status of assigned tasks
CREATE POLICY "Students can update assigned tasks" ON public.tasks FOR UPDATE USING (
    assigned_to = auth.uid()
);
-- Mentors/Admins can manage tasks
CREATE POLICY "Mentors can manage tasks" ON public.tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);

-- Feedback:
-- Viewable by project members
CREATE POLICY "Feedback viewable by project members" ON public.feedback FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = feedback.project_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);
-- Only mentors/admins can create feedback
CREATE POLICY "Mentors can add feedback" ON public.feedback FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);

-- GitHub Repos:
-- Viewable by project members
CREATE POLICY "GitHub repos viewable by project members" ON public.github_repos FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = github_repos.project_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);
-- Mentors/Admins can add/update repos
CREATE POLICY "Mentors can manage repos" ON public.github_repos FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);

-- REALTIME SUBSCRIPTION
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;

-- HELPER FUNCTION FOR USER CREATION (Optional triggering)
-- This function automatically creates a public.users entry when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, COALESCE(new.raw_user_meta_data->>'role', 'student'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER FOR NEW USER
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
