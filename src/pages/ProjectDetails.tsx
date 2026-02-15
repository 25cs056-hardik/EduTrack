import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ArrowLeft,
    Calendar,
    GitBranch,
    Users,
    Star,
    Clock,
    CheckCircle2,
    ExternalLink,
    MessageSquare,
    BarChart3,
    GitFork,
    AlertCircle,
    Code2,
    Mail,
} from "lucide-react";

interface ProjectMember {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

interface ProjectFeedback {
    id: string;
    mentor_id: string;
    message: string;
    rating: number | null;
    status: string;
    created_at: string;
    mentor_name?: string;
}

const statusConfig = {
    active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
    completed: { label: "Completed", className: "bg-primary/10 text-primary border-primary/20" },
    on_hold: { label: "On Hold", className: "bg-warning/10 text-warning border-warning/20" },
};

export default function ProjectDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { getProject } = useProjects();
    const userRole = profile?.role || "student";

    const project = id ? getProject(id) : undefined;
    const ghData = project?.githubData;

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [projectFeedback, setProjectFeedback] = useState<ProjectFeedback[]>([]);
    const [feedbackLoading, setFeedbackLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            if (!id) {
                setMembersLoading(false);
                return;
            }
            try {
                const { data, error } = await (supabase as any)
                    .from("team_members")
                    .select("*")
                    .eq("project_id", id)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Failed to fetch project members:", error);
                    setMembers([]);
                } else {
                    setMembers(data || []);
                }
            } catch (err) {
                console.error("Unexpected error fetching members:", err);
                setMembers([]);
            } finally {
                setMembersLoading(false);
            }
        };

        fetchMembers();
    }, [id]);

    // Fetch real feedback for this project
    useEffect(() => {
        const fetchFeedback = async () => {
            if (!id) {
                setFeedbackLoading(false);
                return;
            }
            try {
                const { data, error } = await (supabase as any)
                    .from("feedback")
                    .select("*")
                    .eq("project_id", id)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Failed to fetch project feedback:", error);
                    setProjectFeedback([]);
                } else {
                    const items = data || [];
                    // Fetch mentor names
                    const mentorIds = [...new Set(items.map((f: any) => f.mentor_id).filter(Boolean))];
                    let namesMap: Record<string, string> = {};
                    if (mentorIds.length > 0) {
                        const { data: users } = await (supabase as any)
                            .from("users")
                            .select("id, name")
                            .in("id", mentorIds);
                        if (users) {
                            users.forEach((u: any) => { namesMap[u.id] = u.name; });
                        }
                    }
                    setProjectFeedback(
                        items.map((f: any) => ({ ...f, mentor_name: namesMap[f.mentor_id] || "Mentor" }))
                    );
                }
            } catch (err) {
                console.error("Unexpected error fetching feedback:", err);
                setProjectFeedback([]);
            } finally {
                setFeedbackLoading(false);
            }
        };
        fetchFeedback();
    }, [id]);

    if (!project) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Project Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        The project you're looking for doesn't exist or has been removed.
                    </p>
                    <Button variant="gradient" onClick={() => navigate("/projects")}>
                        Back to Projects
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back button */}
                <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className={statusConfig[project.status].className}>
                                {statusConfig[project.status].label}
                            </Badge>
                            {project.githubConnected && (
                                <Badge variant="outline" className="text-xs bg-muted/50">
                                    <GitBranch className="h-3 w-3 mr-1" />
                                    GitHub Connected
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
                    </div>
                </div>

                {/* Main grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left column — main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground leading-relaxed">
                                    {project.description || "No description provided."}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Technologies */}
                        {project.technologies.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Technologies</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {project.technologies.map((tech) => (
                                            <Badge key={tech} variant="secondary" className="text-sm">
                                                {tech}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* GitHub Repository — Real Data */}
                        {project.githubRepo && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <GitBranch className="h-5 w-5" />
                                        GitHub Repository
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <a
                                        href={project.githubRepo}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-primary hover:underline"
                                    >
                                        {project.githubRepo}
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>

                                    {ghData ? (
                                        <>
                                            {/* Repo description */}
                                            {ghData.description && (
                                                <p className="text-sm text-muted-foreground">{ghData.description}</p>
                                            )}

                                            {/* Key stats */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                                                    <p className="text-lg font-bold text-foreground">{ghData.totalCommits}</p>
                                                    <p className="text-xs text-muted-foreground">Commits</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                                                    <p className="text-lg font-bold text-foreground">{ghData.totalContributors}</p>
                                                    <p className="text-xs text-muted-foreground">Contributors</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                                                    <p className="text-lg font-bold text-foreground">{ghData.totalBranches}</p>
                                                    <p className="text-xs text-muted-foreground">Branches</p>
                                                </div>
                                            </div>

                                            {/* Extra info */}
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Star className="h-4 w-4 text-amber-400" />
                                                    {ghData.stars} stars
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <GitFork className="h-4 w-4" />
                                                    {ghData.forks} forks
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {ghData.openIssues} open issues
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Code2 className="h-4 w-4" />
                                                    {ghData.language || "N/A"}
                                                </div>
                                            </div>

                                            <p className="text-xs text-muted-foreground pt-1">
                                                Last updated: {ghData.lastUpdated} · Last commit: {ghData.lastCommitDate}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            No GitHub analytics data available for this repository.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Mentor Feedback */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <MessageSquare className="h-5 w-5" />
                                            Mentor Feedback
                                        </CardTitle>
                                        <CardDescription>Feedback received from mentors</CardDescription>
                                    </div>
                                    {(userRole === "mentor" || userRole === "admin") && (
                                        <Button
                                            variant="gradient"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => navigate(`/feedback/new?projectId=${project.id}`)}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Give Feedback
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {feedbackLoading ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Loading feedback...</p>
                                ) : projectFeedback.length > 0 ? (
                                    <div className="space-y-4">
                                        {projectFeedback.map((fb) => (
                                            <div
                                                key={fb.id}
                                                className="p-4 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-all"
                                                onClick={() => navigate(`/feedback/${fb.id}`)}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="font-medium text-foreground">{fb.mentor_name}</p>
                                                    {fb.rating && (
                                                        <div className="flex items-center gap-1">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`h-3.5 w-3.5 ${i < fb.rating!
                                                                        ? "text-amber-400 fill-amber-400"
                                                                        : "text-muted-foreground/30"
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{fb.message}</p>
                                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(fb.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">No feedback received yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column — sidebar info */}
                    <div className="space-y-6">
                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Timeline</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Start Date</p>
                                        <p className="text-sm font-medium text-foreground">{project.startDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-destructive" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Due Date</p>
                                        <p className="text-sm font-medium text-foreground">{project.dueDate}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Project Members */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Project Members
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {membersLoading ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">Loading members...</p>
                                ) : members.length === 0 ? (
                                    <div className="text-center py-4">
                                        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No members added yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {members.map((member) => (
                                            <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src="" />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                                        {member.name.split(" ").map((n) => n[0]).join("")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                                        <Mail className="h-3 w-3 shrink-0" />
                                                        {member.email}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className="capitalize text-xs shrink-0">
                                                    {member.role}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Edit button for students only */}
                        {userRole === "student" && (
                            <Button variant="outline" className="w-full" onClick={() => navigate(`/projects/${project.id}/edit`)}>
                                Edit Project
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
