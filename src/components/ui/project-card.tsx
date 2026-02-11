import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Calendar, Users, GitBranch } from "lucide-react";

interface ProjectCardProps {
  title: string;
  description: string;
  progress: number;
  status: "active" | "completed" | "on_hold";
  dueDate: string;
  members: { name: string; avatar?: string }[];
  tasksCompleted: number;
  totalTasks: number;
  githubConnected?: boolean;
  className?: string;
  onClick?: () => void;
}

const statusConfig = {
  active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
  completed: { label: "Completed", className: "bg-primary/10 text-primary border-primary/20" },
  on_hold: { label: "On Hold", className: "bg-warning/10 text-warning border-warning/20" },
};

export function ProjectCard({
  title,
  description,
  progress,
  status,
  dueDate,
  members,
  tasksCompleted,
  totalTasks,
  githubConnected = false,
  className,
  onClick,
}: ProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300",
        "hover:shadow-xl hover:border-primary/30 hover:-translate-y-1",
        className
      )}
    >
      {/* Header with gradient */}
      <div className="relative h-2 w-full gradient-primary" />

      <div className="p-6">
        {/* Top section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={cn("text-xs", statusConfig[status].className)}
              >
                {statusConfig[status].label}
              </Badge>
              {githubConnected && (
                <Badge variant="outline" className="text-xs bg-muted/50">
                  <GitBranch className="h-3 w-3 mr-1" />
                  GitHub
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {description}
            </p>
          </div>
          <ProgressRing value={progress} size={64} strokeWidth={5} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Due Date</p>
              <p className="text-sm font-medium text-foreground">{dueDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Tasks</p>
              <p className="text-sm font-medium text-foreground">
                {tasksCompleted}/{totalTasks}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member, i) => (
              <Avatar key={i} className="h-8 w-8 border-2 border-card">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 4 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs font-medium text-muted-foreground">
                +{members.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}