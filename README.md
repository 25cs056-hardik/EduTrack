🚀 EduTrack

Student Project Progress & Performance Tracking System with GitHub Integration

EduTrack is a web-based project tracking and performance monitoring platform designed for academic institutions and training programs.
It provides structured project management, mentor feedback, and real-time progress insights, with optional GitHub integration to reflect actual development activity.

⸻

🧩 Problem Statement

Students and early-career developers often work on long-term team projects where:
	•	Project planning, tracking, and feedback are scattered across tools
	•	GitHub shows code activity but lacks academic progress context
	•	Mentors struggle to evaluate individual contributions fairly

This fragmentation results in:
	•	Poor visibility into real project progress
	•	Delayed issue identification
	•	Ineffective performance evaluation

EduTrack solves this by combining project management with GitHub-based activity insights in a single platform.

⸻

🎯 Objectives
	•	Provide a centralized project tracking system
	•	Enable role-based access for Students, Mentors, and Admins
	•	Track tasks, milestones, and deadlines
	•	Collect mentor feedback and review history
	•	Integrate GitHub data to reflect real development activity
	•	Offer scalable and secure architecture

⸻

🏗️ Project Architecture

This project follows a clean, modular architecture:

Frontend
	•	Built using React + TypeScript
	•	Styled with Tailwind CSS
	•	Bundled using Vite
	•	Provides dashboards, task views, and role-based UI

Backend & Database
	•	Supabase used as Backend-as-a-Service
	•	PostgreSQL database
	•	Authentication & RBAC
	•	Row Level Security (RLS)
	•	Supabase Edge Functions
	•	GitHub API integration
	•	Commit and contributor analytics
	•	SQL schema defined explicitly for transparency

🔑 Core Features (Implemented / Planned)

✅ Core Features
	•	User authentication (Student / Mentor / Admin)
	•	Project creation with description and timeline
	•	Team member onboarding
	•	Task & milestone management
	•	Real-time progress tracking
	•	Mentor feedback & comments
	•	Centralized project dashboard

🔗 GitHub Integration (Optional / Extended)
	•	Secure repository linking using GitHub API
	•	Automatic sync of:
	•	Commits
	•	Contributors
	•	Branches
	•	Pull requests
	•	Visualization of contribution activity
	•	Mapping GitHub activity to tasks and milestones

🌟 Advanced Features (Bonus Scope)
	•	Performance scoring based on:
	•	Task completion
	•	Deadlines
	•	Contribution frequency
	•	Role-based access control (RBAC)
	•	Sprint & Agile workflow support
	•	Early risk detection insights
	•	Audit logs & activity tracking
	•	Email / in-app notifications

⸻

🧪 Tech Stack

Frontend
	•	React
	•	TypeScript
	•	Tailwind CSS
	•	Vite

Backend & Database
	•	Supabase (PostgreSQL)
	•	Supabase Auth
	•	Supabase Edge Functions

APIs
	•	GitHub REST API
