import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    ArrowLeft,
    Star,
    Send,
    CheckCircle2,
    Clock,
    Loader2,
    MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

interface ReplyRow {
    id: string;
    feedback_id: string;
    user_id: string;
    message: string;
    created_at: string;
}

interface UserInfo {
    id: string;
    name: string;
    role: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
    addressed: { label: "Addressed", className: "bg-success/10 text-success border-success/20" },
};

export default function FeedbackDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const { toast } = useToast();

    const [feedback, setFeedback] = useState<FeedbackRow | null>(null);
    const [replies, setReplies] = useState<ReplyRow[]>([]);
    const [projectTitle, setProjectTitle] = useState("");
    const [taskTitle, setTaskTitle] = useState("");
    const [mentorName, setMentorName] = useState("");
    const [studentName, setStudentName] = useState("");
    const [usersMap, setUsersMap] = useState<Record<string, UserInfo>>({});
    const [replyContent, setReplyContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [submittingReply, setSubmittingReply] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Fetch feedback, replies, and related info
    useEffect(() => {
        const fetchAll = async () => {
            if (!id) return;

            // Fetch feedback
            const { data: fb, error: fbError } = await (supabase as any)
                .from("feedback")
                .select("*")
                .eq("id", id)
                .single();

            if (fbError || !fb) {
                console.error("Failed to fetch feedback:", fbError);
                setLoading(false);
                return;
            }

            setFeedback(fb);

            // Fetch project title
            const { data: proj } = await (supabase as any)
                .from("projects")
                .select("title")
                .eq("id", fb.project_id)
                .single();
            if (proj) setProjectTitle(proj.title);

            // Fetch task title if applicable
            if (fb.task_id) {
                const { data: task } = await (supabase as any)
                    .from("tasks")
                    .select("title")
                    .eq("id", fb.task_id)
                    .single();
                if (task) setTaskTitle(task.title);
            }

            // Fetch user names for mentor and student
            const userIds = [fb.mentor_id, fb.student_id].filter(Boolean);
            const { data: users } = await (supabase as any)
                .from("users")
                .select("id, name, role")
                .in("id", userIds);

            if (users) {
                const map: Record<string, UserInfo> = {};
                users.forEach((u: UserInfo) => {
                    map[u.id] = u;
                });
                setUsersMap(map);
                setMentorName(map[fb.mentor_id]?.name || "Mentor");
                setStudentName(map[fb.student_id]?.name || "Student");
            }

            // Fetch replies
            await fetchReplies(id);
            setLoading(false);
        };

        fetchAll();
    }, [id]);

    const fetchReplies = async (feedbackId: string) => {
        const { data: repliesData } = await (supabase as any)
            .from("feedback_replies")
            .select("*")
            .eq("feedback_id", feedbackId)
            .order("created_at", { ascending: true });

        if (repliesData) {
            setReplies(repliesData);

            // Fetch names for reply authors not already in usersMap
            const replyUserIds = repliesData
                .map((r: ReplyRow) => r.user_id)
                .filter((uid: string) => uid);
            if (replyUserIds.length > 0) {
                const { data: replyUsers } = await (supabase as any)
                    .from("users")
                    .select("id, name, role")
                    .in("id", replyUserIds);
                if (replyUsers) {
                    setUsersMap((prev) => {
                        const updated = { ...prev };
                        replyUsers.forEach((u: UserInfo) => {
                            updated[u.id] = u;
                        });
                        return updated;
                    });
                }
            }
        }
    };

    const handleSendReply = async () => {
        if (!user || !id || !replyContent.trim()) return;

        setSubmittingReply(true);
        try {
            const { error } = await (supabase as any)
                .from("feedback_replies")
                .insert({
                    feedback_id: id,
                    user_id: user.id,
                    message: replyContent.trim(),
                });

            if (error) {
                console.error("Failed to send reply:", error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to send reply.",
                    variant: "destructive",
                });
            } else {
                setReplyContent("");
                await fetchReplies(id);
                toast({ title: "Reply sent", description: "Your reply has been posted." });
            }
        } finally {
            setSubmittingReply(false);
        }
    };

    const handleMarkAddressed = async () => {
        if (!id || !feedback) return;

        setUpdatingStatus(true);
        try {
            const { error } = await (supabase as any)
                .from("feedback")
                .update({ status: "addressed" })
                .eq("id", id);

            if (error) {
                console.error("Failed to update status:", error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to update status.",
                    variant: "destructive",
                });
            } else {
                setFeedback({ ...feedback, status: "addressed" });
                toast({ title: "Status Updated", description: "Feedback marked as addressed." });
            }
        } finally {
            setUpdatingStatus(false);
        }
    };

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={cn(
                        "h-4 w-4",
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
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (!feedback) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Feedback Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        This feedback doesn't exist or you don't have access to view it.
                    </p>
                    <Button variant="gradient" onClick={() => navigate("/feedback")}>
                        Back to Feedback
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const isStudent = user?.id === feedback.student_id;
    const statusInfo = statusConfig[feedback.status] || statusConfig.pending;

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back */}
                <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate("/feedback")}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to Feedback
                </Button>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Feedback Details</h1>
                        <p className="text-muted-foreground mt-1">{projectTitle}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-sm", statusInfo.className)}>
                        {statusInfo.label}
                    </Badge>
                </div>

                {/* Feedback Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {getInitials(mentorName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg">{mentorName}</CardTitle>
                                    <CardDescription>
                                        {formatDate(feedback.created_at)}
                                    </CardDescription>
                                </div>
                            </div>
                            {feedback.rating && renderStars(feedback.rating)}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Project + Task Info */}
                        <div className="p-4 rounded-lg bg-secondary/50">
                            <p className="font-medium text-foreground">{projectTitle}</p>
                            {taskTitle && (
                                <p className="text-sm text-muted-foreground mt-1">Task: {taskTitle}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                                Student: {studentName}
                            </p>
                        </div>

                        {/* Feedback Content */}
                        <div>
                            <h4 className="font-medium text-foreground mb-2">Feedback</h4>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {feedback.message}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Replies */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Replies ({replies.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {replies.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No replies yet. Start the conversation below.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {replies.map((reply) => {
                                    const authorInfo = usersMap[reply.user_id];
                                    const authorName = authorInfo?.name || "User";
                                    const authorRole = authorInfo?.role || "";
                                    return (
                                        <div key={reply.id} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-accent/10 text-accent text-xs">
                                                    {getInitials(authorName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm text-foreground">
                                                        {authorName}
                                                    </span>
                                                    {authorRole && (
                                                        <Badge variant="outline" className="text-xs capitalize">
                                                            {authorRole}
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(reply.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                                    {reply.message}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Reply Input */}
                        <div className="pt-4 border-t border-border">
                            <div className="flex gap-3">
                                <Textarea
                                    placeholder="Write a reply..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    rows={3}
                                    className="flex-1 resize-none"
                                />
                            </div>
                            <div className="flex justify-between items-center mt-3">
                                <div>
                                    {isStudent && feedback.status === "pending" && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={handleMarkAddressed}
                                            disabled={updatingStatus}
                                        >
                                            {updatingStatus ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4" />
                                            )}
                                            Mark Addressed
                                        </Button>
                                    )}
                                </div>
                                <Button
                                    variant="gradient"
                                    size="sm"
                                    className="gap-1"
                                    onClick={handleSendReply}
                                    disabled={submittingReply || !replyContent.trim()}
                                >
                                    {submittingReply ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    Reply
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
