import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Star, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ProjectOption {
    id: string;
    title: string;
    created_by: string;
}

interface TaskOption {
    id: string;
    title: string;
}

export default function GiveFeedback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, profile } = useAuth();
    const { toast } = useToast();

    const preselectedProjectId = searchParams.get("projectId") || "";
    const preselectedTaskId = searchParams.get("taskId") || "";

    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [tasks, setTasks] = useState<TaskOption[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId);
    const [selectedTaskId, setSelectedTaskId] = useState(preselectedTaskId);
    const [message, setMessage] = useState("");
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [submitting, setSubmitting] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(true);

    // Fetch projects accessible to mentors/admins
    useEffect(() => {
        const fetchProjects = async () => {
            const { data, error } = await (supabase as any)
                .from("projects")
                .select("id, title, created_by")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setProjects(data);
            }
            setLoadingProjects(false);
        };
        fetchProjects();
    }, []);

    // Fetch tasks for the selected project
    useEffect(() => {
        if (!selectedProjectId) {
            setTasks([]);
            return;
        }
        const fetchTasks = async () => {
            const { data, error } = await (supabase as any)
                .from("tasks")
                .select("id, title")
                .eq("project_id", selectedProjectId)
                .order("created_at", { ascending: false });

            if (!error && data) {
                setTasks(data);
            }
        };
        fetchTasks();
    }, [selectedProjectId]);

    const selectedProject = projects.find((p) => p.id === selectedProjectId);

    const handleSubmit = async () => {
        if (!user || !selectedProjectId || !message.trim()) {
            toast({
                title: "Missing fields",
                description: "Please select a project and write your feedback message.",
                variant: "destructive",
            });
            return;
        }

        if (!selectedProject) return;

        setSubmitting(true);
        try {
            const insertObj: Record<string, any> = {
                project_id: selectedProjectId,
                mentor_id: user.id,
                student_id: selectedProject.created_by,
                message: message.trim(),
                status: "pending",
            };

            if (selectedTaskId) insertObj.task_id = selectedTaskId;
            if (rating > 0) insertObj.rating = rating;

            const { error } = await (supabase as any)
                .from("feedback")
                .insert(insertObj);

            if (error) {
                console.error("Failed to submit feedback:", error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to submit feedback.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Feedback Sent",
                    description: "Your feedback has been submitted successfully.",
                });
                navigate("/feedback");
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Back button */}
                <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                <div>
                    <h1 className="text-3xl font-bold text-foreground">Give Feedback</h1>
                    <p className="text-muted-foreground mt-1">
                        Submit feedback for a student's project or task
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Feedback Form</CardTitle>
                        <CardDescription>
                            Select a project, optionally a task, and write your feedback.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Project Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Project <span className="text-destructive">*</span>
                            </label>
                            <Select value={selectedProjectId} onValueChange={(v) => {
                                setSelectedProjectId(v);
                                setSelectedTaskId("");
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingProjects ? "Loading projects..." : "Select a project"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Task Select (optional) */}
                        {selectedProjectId && tasks.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Task <span className="text-muted-foreground">(optional)</span>
                                </label>
                                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a task (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No specific task</SelectItem>
                                        {tasks.map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Student info */}
                        {selectedProject && (
                            <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                                <span className="text-muted-foreground">Feedback will be sent to the project creator.</span>
                            </div>
                        )}

                        {/* Rating */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Rating <span className="text-muted-foreground">(optional)</span>
                            </label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star === rating ? 0 : star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="p-1 transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={cn(
                                                "h-6 w-6 transition-colors",
                                                star <= (hoverRating || rating)
                                                    ? "fill-warning text-warning"
                                                    : "text-muted-foreground/30"
                                            )}
                                        />
                                    </button>
                                ))}
                                {rating > 0 && (
                                    <span className="text-sm text-muted-foreground ml-2 self-center">
                                        {rating}/5
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Feedback Message <span className="text-destructive">*</span>
                            </label>
                            <Textarea
                                placeholder="Write your detailed feedback here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                className="resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            <Button
                                variant="gradient"
                                className="gap-2"
                                onClick={handleSubmit}
                                disabled={submitting || !selectedProjectId || !message.trim()}
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                {submitting ? "Sending..." : "Submit Feedback"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
