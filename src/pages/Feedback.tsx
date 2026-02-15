import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Star,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackRow {
  id: string;
  project_id: string;
  task_id: string | null;
  mentor_id: string;
  student_id: string;
  message: string;
  rating: number | null;
  status: string;
  created_at: string;
}

interface UserInfo {
  id: string;
  name: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  addressed: { label: "Addressed", className: "bg-success/10 text-success border-success/20" },
};

export default function Feedback() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const userRole = profile?.role || "student";

  const [feedbackList, setFeedbackList] = useState<FeedbackRow[]>([]);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [taskNames, setTaskNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!user) return;

      // Fetch feedback — RLS handles filtering by role
      const { data, error } = await (supabase as any)
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch feedback:", error);
        setLoading(false);
        return;
      }

      const items: FeedbackRow[] = data || [];
      setFeedbackList(items);

      // Collect unique IDs for batch lookups
      const projectIds = [...new Set(items.map((f) => f.project_id).filter(Boolean))];
      const taskIds = [...new Set(items.map((f) => f.task_id).filter(Boolean))] as string[];
      const userIds = [
        ...new Set(items.flatMap((f) => [f.mentor_id, f.student_id]).filter(Boolean)),
      ];

      // Fetch project titles
      if (projectIds.length > 0) {
        const { data: projects } = await (supabase as any)
          .from("projects")
          .select("id, title")
          .in("id", projectIds);
        if (projects) {
          const map: Record<string, string> = {};
          projects.forEach((p: any) => { map[p.id] = p.title; });
          setProjectNames(map);
        }
      }

      // Fetch task titles
      if (taskIds.length > 0) {
        const { data: tasks } = await (supabase as any)
          .from("tasks")
          .select("id, title")
          .in("id", taskIds);
        if (tasks) {
          const map: Record<string, string> = {};
          tasks.forEach((t: any) => { map[t.id] = t.title; });
          setTaskNames(map);
        }
      }

      // Fetch user names
      if (userIds.length > 0) {
        const { data: users } = await (supabase as any)
          .from("users")
          .select("id, name")
          .in("id", userIds);
        if (users) {
          const map: Record<string, string> = {};
          users.forEach((u: any) => { map[u.id] = u.name; });
          setUserNames(map);
        }
      }

      setLoading(false);
    };

    fetchFeedback();
  }, [user]);

  const filteredFeedback = feedbackList.filter(
    (f) => filterStatus === "all" || f.status === filterStatus
  );

  const pendingCount = feedbackList.filter((f) => f.status === "pending").length;
  const addressedCount = feedbackList.filter((f) => f.status === "addressed").length;

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3.5 w-3.5",
            star <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const canGiveFeedback = userRole === "mentor" || userRole === "admin";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <h1 className="text-3xl font-bold text-foreground">
              {userRole === "student" ? "My Feedback" : "Feedback"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {userRole === "student"
                ? "Feedback received from your mentors"
                : "Feedback you've given to students"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Feedback</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="addressed">Addressed</SelectItem>
              </SelectContent>
            </Select>
            {canGiveFeedback && (
              <Button variant="gradient" className="gap-2" onClick={() => navigate("/feedback/new")}>
                <Plus className="h-4 w-4" />
                Give Feedback
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Addressed</p>
                  <p className="text-2xl font-bold text-foreground">{addressedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Feedback</p>
                  <p className="text-2xl font-bold text-foreground">{feedbackList.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        {filteredFeedback.length === 0 ? (
          <Card className="py-16">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No feedback yet</p>
              <p className="text-sm mt-1">
                {canGiveFeedback
                  ? "Start by giving feedback on a student's project."
                  : "You'll see feedback from mentors here."}
              </p>
              {canGiveFeedback && (
                <Button variant="gradient" className="mt-4 gap-2" onClick={() => navigate("/feedback/new")}>
                  <Plus className="h-4 w-4" />
                  Give Feedback
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredFeedback.map((fb) => {
              const projName = projectNames[fb.project_id] || "Unknown Project";
              const taskName = fb.task_id ? taskNames[fb.task_id] : null;
              const mentorFullName = userNames[fb.mentor_id] || "Mentor";
              const studentFullName = userNames[fb.student_id] || "Student";
              const displayName = userRole === "student" ? mentorFullName : studentFullName;
              const statusInfo = statusConfig[fb.status] || statusConfig.pending;

              return (
                <div
                  key={fb.id}
                  onClick={() => navigate(`/feedback/${fb.id}`)}
                  className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground text-sm truncate">
                          {userRole === "student" ? `From: ${mentorFullName}` : `To: ${studentFullName}`}
                        </span>
                        <Badge variant="outline" className={cn("text-xs", statusInfo.className)}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground line-clamp-1 font-medium">
                        {projName}
                      </p>
                      {taskName && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          Task: {taskName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {fb.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(fb.created_at)}
                        </span>
                        {fb.rating && renderStars(fb.rating)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}