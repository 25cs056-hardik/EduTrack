# API Usage Examples

Below are examples of how to interact with the backend using the Supabase JavaScript Client.

## 1. Authentication

### Sign Up (Student)
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'student@example.com',
  password: 'securepassword',
  options: {
    data: {
      name: 'John Doe',
      role: 'student' // Optional, defaults to student if omitted
    }
  }
})
```

### Sign In
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'student@example.com',
  password: 'securepassword'
})
```

### Sign Out
```javascript
const { error } = await supabase.auth.signOut()
```

## 2. Projects & Tasks

### Fetch Projects for User
```javascript
// Fetch projects user is a member of
const { data: projects, error } = await supabase
  .from('projects')
  .select(`
    *,
    project_members!inner(user_id)
  `)
  .eq('project_members.user_id', user.id)
```

### Create a Task
```javascript
const { data, error } = await supabase
  .from('tasks')
  .insert([
    {
      title: 'Implement Login Page',
      project_id: 'project-uuid-123',
      priority: 'high',
      deadline: '2023-12-31'
    }
  ])
  .select()
```

### Update Task Status
```javascript
const { data, error } = await supabase
  .from('tasks')
  .update({ status: 'in_progress' })
  .eq('id', 'task-uuid-456')
  .select()
```

## 3. Real-time Subscriptions

Subscribe to changes on the `tasks` table to update the UI instantly.

```javascript
const channel = supabase
  .channel('public:tasks')
  .on(
    'postgres_changes',
    {
      event: '*', // Listen to INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'tasks',
      filter: `project_id=eq.${projectId}` // Optional: Filter by project
    },
    (payload) => {
      console.log('Change received!', payload)
      // payload.new contains the new record
      // payload.old contains the old record (for updates/deletes)
    }
  )
  .subscribe()

// Clean up on unmount
// supabase.removeChannel(channel)
```

## 4. GitHub Integration

Call the Edge Function to sync repository stats.

```javascript
const { data, error } = await supabase.functions.invoke('github-stats', {
  body: {
    repoUrl: 'https://github.com/facebook/react',
    projectId: 'project-uuid-123'
  }
})

if (error) console.error('Function error:', error)
else console.log('Stats updated:', data)
```
