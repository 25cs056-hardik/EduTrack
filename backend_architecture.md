# Backend Architecture: Student Project Tracking System

This document outlines the architecture of the backend built on Supabase.

## Overview

The system leverages **Supabase** as a Backend-as-a-Service (BaaS) provider, utilizing its core features:
-   **PostgreSQL**: For relational data storage.
-   **GoTrue (Auth)**: For user authentication and management.
-   **PostgREST**: For auto-generated RESTful APIs.
-   **Realtime**: For live updates on database changes.
-   **Edge Functions**: For server-side logic (GitHub integration).

## Data Model

The database is normalized to ensure data integrity and efficient querying.

### Tables
1.  **`users`**:
    -   Extends Supabase's built-in `auth.users` via a trigger.
    -   Stores application-specific profile data (name, role).
    -   Roles: `student`, `mentor`, `admin`.

2.  **`projects`**:
    -   Core entity.
    -   Linked to a creator (mentor/admin).

3.  **`project_members`**:
    -   Junction table for Many-to-Many relationship between `projects` and `users`.
    -   Allows multiple students to be assigned to a project.

4.  **`tasks`**:
    -   Work items linked to a `project`.
    -   Can be assigned to a specific `user`.
    -   Tracks status (`todo`, `in_progress`, `completed`), priority, and deadline.

5.  **`feedback`**:
    -   Comments provided by mentors on projects.

6.  **`github_repos`**:
    -   Stores metadata about linked GitHub repositories.
    -   Updated via Edge Function to keep stats in sync without exposing source code.

## Security Model (RLS)

Row Level Security (RLS) is strictly enforced at the database layer.

| Role | Access Level |
| :--- | :--- |
| **Student** | **Read-Only**: Assigned projects, tasks, feedback.<br>**Update**: Task status (if assigned). |
| **Mentor** | **Read/Write**: Projects they created or are assigned to.<br>**Create**: Projects, Tasks, Feedback. |
| **Admin** | **Full Access**: Can manage all data. |

**No direct database access is allowed from the client without RLS policies.**

## Real-time Updates

Supabase Realtime is enabled for:
-   `tasks`: To show status changes instantly on the Kanban board/list.
-   `projects`: To reflect progress updates.
-   `feedback`: To notify students of new mentor comments immediately.

Clients subscribe to changes using the Supabase JS client:
```javascript
supabase
  .channel('public:tasks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
    // Handle update
  })
  .subscribe()
```

## GitHub Integration

To avoid exposing GitHub tokens on the client and to handle API rate limits/logic, we use a **Supabase Edge Function** (`github-stats`).

**Flow:**
1.  Client triggers function with `repoUrl` and `projectId`.
2.  Edge Function validates input.
3.  Edge Function calls GitHub API using a secure server-side token (`GITHUB_ACCESS_TOKEN`).
4.  Edge Function fetches stars, commits, contributors.
5.  Edge Function upserts data into the `github_repos` table.
6.  Client receives success response and `github_repos` table updates (via Realtime or refresh).

## Tech Stack
-   **Database**: PostgreSQL 15+
-   **API Layer**: PostgREST (Automatic)
-   **Auth**: JWT (Supabase Auth)
-   **Serverless**: Deno (Edge Functions)
