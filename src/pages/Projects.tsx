import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectCard } from "@/components/ui/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, LayoutGrid, List, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const allProjects = [
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
  {
    id: "3",
    title: "Mobile App for Campus Events",
    description: "React Native app for managing and discovering campus events",
    progress: 100,
    status: "completed" as const,
    dueDate: "Jan 10, 2024",
    members: [{ name: "Frank Miller" }, { name: "Grace Lee" }, { name: "Henry Wilson" }],
    tasksCompleted: 32,
    totalTasks: 32,
    githubConnected: true,
  },
  {
    id: "4",
    title: "AI Chatbot for Student Support",
    description: "Implementing an AI-powered chatbot to assist students with queries",
    progress: 20,
    status: "on_hold" as const,
    dueDate: "May 30, 2024",
    members: [{ name: "Ivy Chen" }],
    tasksCompleted: 4,
    totalTasks: 20,
    githubConnected: true,
  },
];

type StatusFilter = "all" | "active" | "completed" | "on_hold";

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  const filteredProjects = allProjects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: allProjects.length,
    active: allProjects.filter((p) => p.status === "active").length,
    completed: allProjects.filter((p) => p.status === "completed").length,
    on_hold: allProjects.filter((p) => p.status === "on_hold").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your academic projects
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
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input 
                    id="project-name" 
                    placeholder="Enter project name" 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project objectives..."
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input id="due-date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
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
                  <Label htmlFor="github">GitHub Repository (Optional)</Label>
                  <div className="relative">
                    <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="github"
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

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "active", "completed", "on_hold"] as StatusFilter[]).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="gap-2"
              >
                {status === "all" ? "All" : status === "on_hold" ? "On Hold" : status.charAt(0).toUpperCase() + status.slice(1)}
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {statusCounts[status]}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center border border-border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                : "space-y-4"
            )}
          >
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ProjectCard {...project} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No projects found</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}