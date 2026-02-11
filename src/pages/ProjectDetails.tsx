import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/ui/progress-ring";
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
} from "lucide-react";

// Demo mentor feedback
const demoFeedback = [
    {
        id: "f1",
        mentor: "Dr. Sarah Wilson",
        content: "Good progress on the authentication module. Consider adding rate limiting for the API endpoints.",
        date: "Jan 10, 2024",
        rating: 4,
    },
    {
        id: "f2",
        mentor: "Dr. Sarah Wilson",
        content: "The database schema looks solid. Make sure to add proper indexes for query optimization.",
        date: "Dec 15, 2023",
        rating: 5,
    },
];

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
                    <ProgressRing value={project.progress} size={80} strokeWidth={6} />
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
                        {project.githubUrl && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <GitBranch className="h-5 w-5" />
                                        GitHub Repository
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <a
                                        href={project.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-primary hover:underline"
                                    >
                                        {project.githubUrl}
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
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    Mentor Feedback
                                </CardTitle>
                                <CardDescription>Feedback received from your mentor</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {demoFeedback.length > 0 ? (
                                    <div className="space-y-4">
                                        {demoFeedback.map((fb) => (
                                            <div key={fb.id} className="p-4 rounded-lg border border-border">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="font-medium text-foreground">{fb.mentor}</p>
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`h-3.5 w-3.5 ${i < fb.rating
                                                                        ? "text-amber-400 fill-amber-400"
                                                                        : "text-muted-foreground/30"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{fb.content}</p>
                                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {fb.date}
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

                        {/* Progress Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Progress Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">Overall Progress</span>
                                        <span className="font-medium text-foreground">{project.progress}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-secondary">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                    <span className="text-muted-foreground">
                                        {project.tasksCompleted} of {project.totalTasks} tasks completed
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Team Members */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Team Members
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {project.members.length > 0 ? (
                                    <div className="space-y-3">
                                        {project.members.map((member, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.avatar} />
                                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                        {member.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm text-foreground">{member.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No team members yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Edit button for students only */}
                        {userRole === "student" && (
                            <Button variant="outline" className="w-full">
                                Edit Project
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
