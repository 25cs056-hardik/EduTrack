import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TaskCard } from "@/components/ui/task-card";
import { useTasks, TaskStatus } from "@/contexts/TasksContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "bg-muted-foreground" },
  { id: "in_progress", label: "In Progress", color: "bg-info" },
  { id: "completed", label: "Completed", color: "bg-success" },
];

export default function Tasks() {
  const { tasks, loading } = useTasks();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((task) => task.status === status);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </DashboardLayout>
    );
  }

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
            <Link to="/tasks/new">
              <Button variant="gradient" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </Link>
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
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {columnTasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <TaskCard
                        title={task.title}
                        description={task.description}
                        priority={task.priority}
                        status={task.status}
                        dueDate={task.dueDate}
                        tags={task.tags}
                      />
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