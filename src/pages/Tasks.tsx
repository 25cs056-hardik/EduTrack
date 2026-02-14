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
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/contexts/TasksContext";

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "bg-muted-foreground" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { id: "completed", label: "Completed", color: "bg-green-500" },
];

// --- Droppable Column ---
function DroppableColumn({
  id,
  label,
  color,
  count,
  isOver,
  children,
}: {
  id: string;
  label: string;
  color: string;
  count: number;
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl p-4 min-h-[500px] transition-colors duration-200",
        isOver
          ? "bg-primary/10 ring-2 ring-primary/30"
          : "bg-secondary/30"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", color)} />
          <h3 className="font-semibold text-foreground">{label}</h3>
          <Badge variant="secondary" className="ml-1">
            {count}
          </Badge>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// --- Draggable Task ---
function DraggableTask({
  task,
  isDragging,
}: {
  task: Task;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transform ? "none" : "transform 200ms ease",
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard
        title={task.title}
        description={task.description}
        priority={task.priority}
        status={task.status}
        dueDate={task.dueDate}
        tags={task.tags}
      />
    </div>
  );
}

export default function Tasks() {
  const { tasks, loading, updateTaskStatus } = useTasks();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const getTasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((task) => task.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event: any) => {
    const overId = event.over?.id as string | null;
    if (overId && columns.some((c) => c.id === overId)) {
      setOverColumnId(overId);
    } else {
      setOverColumnId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    setOverColumnId(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Only process if dropped on a valid column
    if (!columns.some((c) => c.id === newStatus)) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setUpdating(true);
    try {
      await updateTaskStatus(taskId, newStatus);
      toast({
        title: "Task Updated",
        description: `Moved to ${columns.find((c) => c.id === newStatus)?.label}`,
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Could not update task status.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverColumnId(null);
  };

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
              Drag tasks between columns to update their status
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => {
              const columnTasks = getTasksByStatus(column.id);
              return (
                <DroppableColumn
                  key={column.id}
                  id={column.id}
                  label={column.label}
                  color={column.color}
                  count={columnTasks.length}
                  isOver={overColumnId === column.id}
                >
                  {columnTasks.map((task) => (
                    <DraggableTask
                      key={task.id}
                      task={task}
                      isDragging={activeTask?.id === task.id}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-border rounded-xl">
                      <p className="text-sm text-muted-foreground">No tasks</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Drag tasks here
                      </p>
                    </div>
                  )}
                </DroppableColumn>
              );
            })}
          </div>

          {/* Drag Overlay — shows a ghost of the card while dragging */}
          <DragOverlay>
            {activeTask ? (
              <div className="opacity-90 rotate-2 scale-105 shadow-2xl">
                <TaskCard
                  title={activeTask.title}
                  description={activeTask.description}
                  priority={activeTask.priority}
                  status={activeTask.status}
                  dueDate={activeTask.dueDate}
                  tags={activeTask.tags}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </DashboardLayout>
  );
}