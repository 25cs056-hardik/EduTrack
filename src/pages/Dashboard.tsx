import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { ProjectCard } from "@/components/ui/project-card";
import { TaskCard } from "@/components/ui/task-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderKanban,
  ListTodo,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  GitBranch,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const progressData = [
  { name: "Mon", tasks: 4, completed: 3 },
  { name: "Tue", tasks: 6, completed: 5 },
  { name: "Wed", tasks: 8, completed: 6 },
  { name: "Thu", tasks: 5, completed: 5 },
  { name: "Fri", tasks: 7, completed: 4 },
  { name: "Sat", tasks: 3, completed: 3 },
  { name: "Sun", tasks: 2, completed: 2 },
];

const projects = [
  {
    id: "1",
    title: "E-Commerce Platform Development",
    description: "Building a full-stack e-commerce solution with React and Node.js",
    progress: 75,
    status: "active" as const,
    dueDate: "Mar 15, 2024",
    members: [
      { name: "Alice Johnson" },
      { name: "Bob Smith" },
      { name: "Carol White" },
    ],
    tasksCompleted: 18,
    totalTasks: 24,
    githubConnected: true,
  },
  {
    id: "2",
    title: "Machine Learning Research Paper",
    description: "Research on deep learning applications in healthcare",
    progress: 45,
    status: "active" as const,
    dueDate: "Apr 20, 2024",
    members: [{ name: "David Lee" }, { name: "Eva Green" }],
    tasksCompleted: 9,
    totalTasks: 20,
    githubConnected: false,
  },
];

const recentTasks = [
  {
    id: "1",
    title: "Implement user authentication",
    description: "Add JWT-based auth with refresh tokens",
    priority: "high" as const,
    status: "in_progress" as const,
    dueDate: "Jan 12",
    assignees: [{ name: "Alice Johnson" }],
    comments: 5,
    tags: ["Backend", "Security"],
  },
  {
    id: "2",
    title: "Design dashboard wireframes",
    priority: "medium" as const,
    status: "completed" as const,
    dueDate: "Jan 10",
    assignees: [{ name: "Bob Smith" }],
    comments: 3,
    tags: ["Design"],
  },
  {
    id: "3",
    title: "Set up CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing and deployment",
    priority: "urgent" as const,
    status: "todo" as const,
    dueDate: "Jan 15",
    assignees: [{ name: "Carol White" }, { name: "David Lee" }],
    comments: 8,
    tags: ["DevOps"],
  },
];

const upcomingDeadlines = [
  { title: "API Documentation", date: "Jan 12", type: "milestone" },
  { title: "Code Review Meeting", date: "Jan 13", type: "meeting" },
  { title: "Sprint Review", date: "Jan 15", type: "milestone" },
];

export default function Dashboard() {
  const [userRole] = useState<"student" | "mentor" | "admin">("student");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Project Created",
      description: `"${projectName}" has been created successfully.`,
    });
    setProjectName("");
    setDescription("");
    setIsCreateOpen(false);
  };

  return (
    <DashboardLayout userRole={userRole}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, John! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your projects today.
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new project by filling in the details below.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4 mt-4" onSubmit={handleCreateProject}>
                <div className="space-y-2">
                  <Label htmlFor="dashboard-project-name">Project Name</Label>
                  <Input 
                    id="dashboard-project-name" 
                    placeholder="Enter project name" 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboard-description">Description</Label>
                  <Textarea
                    id="dashboard-description"
                    placeholder="Describe your project objectives..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dashboard-due-date">Due Date</Label>
                    <Input id="dashboard-due-date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dashboard-status">Status</Label>
                    <Select defaultValue="active">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboard-github">GitHub Repository (Optional)</Label>
                  <div className="relative">
                    <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dashboard-github"
                      placeholder="https://github.com/username/repo"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="gradient" className="flex-1">
                    Create Project
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={5}
            subtitle="2 active this week"
            icon={FolderKanban}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Tasks Completed"
            value={42}
            subtitle="8 this week"
            icon={ListTodo}
            variant="success"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Team Members"
            value={12}
            subtitle="Across all projects"
            icon={Users}
            variant="accent"
          />
          <StatCard
            title="Overall Progress"
            value="68%"
            subtitle="Average completion"
            icon={TrendingUp}
            variant="warning"
            trend={{ value: 5, isPositive: true }}
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
                <AreaChart data={progressData}>
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
              {upcomingDeadlines.map((deadline, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 transition-colors hover:bg-secondary"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      deadline.type === "milestone"
                        ? "bg-primary/10 text-primary"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {deadline.type === "milestone" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {deadline.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{deadline.date}</p>
                  </div>
                </div>
              ))}
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
            {projects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
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
            {recentTasks.map((task) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}