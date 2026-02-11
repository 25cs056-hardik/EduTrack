import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Flag, MessageSquare } from "lucide-react";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "completed";

interface TaskCardProps {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  assignees?: { name: string; avatar?: string }[];
  comments?: number;
  tags?: string[];
  className?: string;
  onClick?: () => void;
}

const priorityConfig = {
  low: { color: "bg-muted text-muted-foreground", icon: "text-muted-foreground" },
  medium: { color: "bg-info/10 text-info", icon: "text-info" },
  high: { color: "bg-warning/10 text-warning", icon: "text-warning" },
  urgent: { color: "bg-destructive/10 text-destructive", icon: "text-destructive" },
};

export function TaskCard({
  title,
  description,
  priority,
  status,
  dueDate,
  assignees = [],
  comments = 0,
  tags = [],
  className,
  onClick,
}: TaskCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-xl border border-border bg-card p-4 transition-all duration-200",
        "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5",
        "active:scale-[0.99]",
        className
      )}
    >
      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Title & Description */}
      <h4 className="font-medium text-foreground line-clamp-2 mb-1">{title}</h4>
      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-3">
          {/* Priority */}
          <div className={cn("flex items-center gap-1", priorityConfig[priority].icon)}>
            <Flag className="h-3.5 w-3.5" />
          </div>

          {/* Due Date */}
          {dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{dueDate}</span>
            </div>
          )}

          {/* Comments */}
          {comments > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{comments}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {assignees.length > 0 && (
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((assignee, i) => (
              <Avatar key={i} className="h-6 w-6 border-2 border-card">
                <AvatarImage src={assignee.avatar} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {assignee.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
            ))}
            {assignees.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium text-muted-foreground">
                +{assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}