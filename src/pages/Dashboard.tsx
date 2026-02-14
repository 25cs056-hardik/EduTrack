import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import MentorDashboard from "@/pages/dashboards/MentorDashboard";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { ProjectCard } from "@/components/ui/project-card";
import { useProjects } from "@/contexts/ProjectsContext";
import { useTasks } from "@/contexts/TasksContext";
import { TaskCard } from "@/components/ui/task-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Helper: group tasks by day-of-week for chart
function buildWeeklyChartData(
  tasks: { status: string; createdAt: string }[]
): { name: string; tasks: number; completed: number }[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets: Record<string, { tasks: number; completed: number }> = {};
  for (const d of dayNames) {
    buckets[d] = { tasks: 0, completed: 0 };
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const t of tasks) {
    const created = new Date(t.createdAt);
    if (created >= weekAgo) {
      const day = dayNames[created.getDay()];
      buckets[day].tasks += 1;
      if (t.status === "completed") {
        buckets[day].completed += 1;
      }
    }
  }

  // Start from Monday
  const ordered = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return ordered.map((d) => ({ name: d, ...buckets[d] }));
}

// Helper: get upcoming deadlines from tasks
function getUpcomingDeadlines(
  tasks: { title: string; dueDate: string; status: string }[]
): { title: string; date: string; isOverdue: boolean }[] {
  const now = new Date();
  return tasks
    .filter((t) => t.dueDate && t.status !== "completed")
    .map((t) => ({
      title: t.title,
      date: t.dueDate,
      isOverdue: new Date(t.dueDate) < now,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
}

export default function Dashboard() {
  const { profile, loading } = useAuth();
  const userRole = profile?.role || "student";
  const userFirstName = profile?.name?.split(" ")[0] || "there";
  const { projects } = useProjects();
  const { tasks } = useTasks();

  // Route to role-specific dashboard
  if (!loading && userRole === "mentor") return <MentorDashboard />;
  if (!loading && userRole === "admin") return <AdminDashboard />;

  // Derived stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  const chartData = buildWeeklyChartData(tasks);
  const deadlines = getUpcomingDeadlines(tasks);
  const recentTasks = tasks.slice(0, 3);

  return (
    <DashboardLayout userRole="student">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {userFirstName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your projects today.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={totalProjects}
            subtitle={`${activeProjects} active`}
            icon={FolderKanban}
            variant="primary"
          />
          <StatCard
            title="Tasks Completed"
            value={completedTasks}
            subtitle={`of ${totalTasks} total`}
            icon={ListTodo}
            variant="success"
          />
          <StatCard
            title="Total Tasks"
            value={totalTasks}
            subtitle="Across all projects"
            icon={CheckCircle2}
            variant="accent"
          />
          <StatCard
            title="Active Projects"
            value={activeProjects}
            subtitle="Currently in progress"
            icon={TrendingUp}
            variant="warning"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Progress Chart */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Weekly Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Tasks completed vs. assigned
                </p>
              </div>
              <Badge variant="secondary">This Week</Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tasks"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTasks)"
                    name="Assigned"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                    name="Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Upcoming Deadlines</h3>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              {deadlines.length > 0 ? (
                deadlines.map((deadline, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 transition-colors hover:bg-secondary"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${deadline.isOverdue
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                        }`}
                    >
                      {deadline.isOverdue ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {deadline.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{deadline.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No upcoming deadlines
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Active Projects</h3>
            <Link to="/projects">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {projects.length > 0 ? (
              projects.slice(0, 4).map((project) => (
                <ProjectCard
                  key={project.id}
                  title={project.title}
                  description={project.description}
                  status={project.status}
                  dueDate={project.dueDate}
                  githubConnected={project.githubConnected}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground col-span-2 text-center py-8">
                No projects yet. Create your first project!
              </p>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Recent Tasks</h3>
            <Link to="/tasks">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  title={task.title}
                  description={task.description}
                  priority={task.priority}
                  status={task.status}
                  dueDate={task.dueDate}
                  tags={task.tags}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground col-span-3 text-center py-8">
                No tasks yet. Head to the Tasks page to create one!
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}