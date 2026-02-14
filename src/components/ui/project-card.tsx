import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, GitBranch, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ProjectStatus = "active" | "completed" | "on_hold";

interface ProjectCardProps {
  id?: string;
  title: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
  githubConnected?: boolean;
  className?: string;
  onClick?: () => void;
  onStatusChange?: (id: string, newStatus: ProjectStatus) => Promise<void>;
}

const statusConfig: Record<ProjectStatus, { label: string; className: string; dot: string }> = {
  active: { label: "Active", className: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  completed: { label: "Completed", className: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
  on_hold: { label: "On Hold", className: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
};

const allStatuses: ProjectStatus[] = ["active", "completed", "on_hold"];

export function ProjectCard({
  id,
  title,
  description,
  status,
  dueDate,
  githubConnected = false,
  className,
  onClick,
  onStatusChange,
}: ProjectCardProps) {
  const [confirmStatus, setConfirmStatus] = useState<ProjectStatus | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleConfirm = async () => {
    if (!confirmStatus || !id || !onStatusChange) return;
    setUpdating(true);
    try {
      await onStatusChange(id, confirmStatus);
    } finally {
      setUpdating(false);
      setConfirmStatus(null);
    }
  };

  return (
    <>
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

            {/* Three-dot menu */}
            {onStatusChange && id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuLabel>Move to</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allStatuses
                    .filter((s) => s !== status)
                    .map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onSelect={() => setConfirmStatus(s)}
                      >
                        <span className={cn("mr-2 h-2 w-2 rounded-full inline-block", statusConfig[s].dot)} />
                        {statusConfig[s].label}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Due Date */}
          <div className="p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="text-sm font-medium text-foreground">{dueDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmStatus} onOpenChange={(open) => { if (!open) setConfirmStatus(null); }}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Move Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move <strong>"{title}"</strong> to{" "}
              <strong>{confirmStatus ? statusConfig[confirmStatus].label : ""}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={updating}>
              {updating ? "Moving..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}