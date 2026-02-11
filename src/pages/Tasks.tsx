import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TaskCard, TaskPriority, TaskStatus } from "@/components/ui/task-card";
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
import { Plus, Search, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  assignees?: { name: string; avatar?: string }[];
  comments?: number;
  tags?: string[];
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Implement user authentication",
    description: "Add JWT-based auth with refresh tokens",
    priority: "high",
    status: "in_progress",
    dueDate: "Jan 12",
    assignees: [{ name: "Alice Johnson" }],
    comments: 5,
    tags: ["Backend", "Security"],
  },
  {
    id: "2",
    title: "Design dashboard wireframes",
    priority: "medium",
    status: "completed",
    dueDate: "Jan 10",
    assignees: [{ name: "Bob Smith" }],
    comments: 3,
    tags: ["Design"],
  },
  {
    id: "3",
    title: "Set up CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing and deployment",
    priority: "urgent",
    status: "todo",
    dueDate: "Jan 15",
    assignees: [{ name: "Carol White" }, { name: "David Lee" }],
    comments: 8,
    tags: ["DevOps"],
  },
  {
    id: "4",
    title: "Create API documentation",
    description: "Document all endpoints using Swagger/OpenAPI",
    priority: "medium",
    status: "todo",
    dueDate: "Jan 18",
    assignees: [{ name: "Eva Green" }],
    comments: 2,
    tags: ["Documentation"],
  },
  {
    id: "5",
    title: "Implement search functionality",
    priority: "low",
    status: "todo",
    dueDate: "Jan 20",
    assignees: [{ name: "Frank Miller" }],
    comments: 0,
    tags: ["Frontend"],
  },
  {
    id: "6",
    title: "Database schema optimization",
    description: "Optimize queries and add proper indexing",
    priority: "high",
    status: "in_progress",
    dueDate: "Jan 14",
    assignees: [{ name: "Grace Lee" }],
    comments: 4,
    tags: ["Database"],
  },
  {
    id: "7",
    title: "Unit tests for core modules",
    priority: "medium",
    status: "completed",
    dueDate: "Jan 8",
    assignees: [{ name: "Henry Wilson" }],
    comments: 1,
    tags: ["Testing"],
  },
];

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "bg-muted-foreground" },
  { id: "in_progress", label: "In Progress", color: "bg-info" },
  { id: "completed", label: "Completed", color: "bg-success" },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((task) => task.status === status);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Task Board</h1>
            <p className="text-muted-foreground mt-1">
              Organize and track your tasks with Kanban-style board
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to your project board.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input id="task-title" placeholder="Enter task title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      placeholder="Describe the task..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due-date">Due Date</Label>
                      <Input id="due-date" type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input id="tags" placeholder="e.g., Frontend, Bug Fix" />
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
                      Create Task
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            return (
              <div
                key={column.id}
                className="bg-secondary/30 rounded-xl p-4 min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", column.color)} />
                    <h3 className="font-semibold text-foreground">{column.label}</h3>
                    <Badge variant="secondary" className="ml-1">
                      {columnTasks.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {columnTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <TaskCard {...task} />
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-border rounded-xl">
                      <p className="text-sm text-muted-foreground">No tasks</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Drop tasks here or create new
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}