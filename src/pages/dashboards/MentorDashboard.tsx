import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Users,
    FolderKanban,
    MessageSquare,
    Star,
    Clock,
    CheckCircle2,
    Send,
    Loader2,
    AlertCircle,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// ── Types ──────────────────────────────────────────────
interface ProjectInfo {
    id: string;
    title: string;
}

interface StudentInfo {
    id: string;
    name: string;
    email: string;
    project_id: string;
    project_title: string;
}

interface FeedbackRow {
    id: string;
    project_id: string;
    student_id: string;
    message: string;
    rating: number | null;
    status: string;
    created_at: string;
}

// ── Component ──────────────────────────────────────────
export default function MentorDashboard() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const userFirstName = profile?.name?.split(" ")[0] || "Mentor";

    const [projects, setProjects] = useState<ProjectInfo[]>([]);
    const [students, setStudents] = useState<StudentInfo[]>([]);
    const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Data fetching ──────────────────────────────────
    useEffect(() => {
        const fetchAll = async () => {
            if (!user) return;

            // 1. Get projects where this mentor is a member
            const { data: memberRows } = await (supabase as any)
                .from("project_members")
                .select("project_id")
                .eq("user_id", user.id)
                .eq("role", "mentor");

            const projectIds: string[] = (memberRows || []).map((r: any) => r.project_id);

            if (projectIds.length === 0) {
                setLoading(false);
                return;
            }

            // 2. Fetch project details
            const { data: projData } = await (supabase as any)
                .from("projects")
                .select("id, title")
                .in("id", projectIds);

            const projectsList: ProjectInfo[] = projData || [];
            setProjects(projectsList);
            const projMap: Record<string, string> = {};
            projectsList.forEach((p) => { projMap[p.id] = p.title; });

            // 3. Fetch all members of these projects, then filter to students
            const { data: allMembers } = await (supabase as any)
                .from("project_members")
                .select("project_id, user_id")
                .in("project_id", projectIds);

            const memberUserIds = [...new Set((allMembers || []).map((m: any) => m.user_id))] as string[];

            // Fetch user info for those members
            let usersMap: Record<string, { name: string; email: string; role: string }> = {};
            if (memberUserIds.length > 0) {
                const { data: usersData } = await (supabase as any)
                    .from("users")
                    .select("id, name, email, role")
                    .in("id", memberUserIds);
                (usersData || []).forEach((u: any) => { usersMap[u.id] = u; });
            }

            // Build student list (only users with role=student)
            const studentList: StudentInfo[] = [];
            const seen = new Set<string>();
            (allMembers || []).forEach((m: any) => {
                const u = usersMap[m.user_id];
                const key = `${m.user_id}_${m.project_id}`;
                if (u && u.role === "student" && !seen.has(key)) {
                    seen.add(key);
                    studentList.push({
                        id: m.user_id,
                        name: u.name,
                        email: u.email,
                        project_id: m.project_id,
                        project_title: projMap[m.project_id] || "Unknown",
                    });
                }
            });
            setStudents(studentList);

            // 4. Fetch feedback given by this mentor
            const { data: fbData } = await (supabase as any)
                .from("feedback")
                .select("*")
                .eq("mentor_id", user.id)
                .order("created_at", { ascending: false });

            setFeedback(fbData || []);
            setLoading(false);
        };

        fetchAll();
    }, [user]);

    // ── Derived stats ──────────────────────────────────
    const uniqueStudentIds = new Set(students.map((s) => s.id));
    const pendingCount = feedback.filter((f) => f.status === "pending").length;
    const addressedCount = feedback.filter((f) => f.status === "addressed").length;

    // Build "feedback per day this week" chart data
    const buildWeeklyChart = () => {
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const buckets: Record<string, number> = {};
        dayNames.forEach((d) => { buckets[d] = 0; });

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        feedback.forEach((f) => {
            const d = new Date(f.created_at);
            if (d >= weekAgo) {
                const jsDay = d.getDay(); // 0=Sun
                const dayIdx = jsDay === 0 ? 6 : jsDay - 1; // shift to Mon=0
                buckets[dayNames[dayIdx]] += 1;
            }
        });

        return dayNames.map((d) => ({ name: d, feedback: buckets[d] }));
    };

    const chartData = buildWeeklyChart();
    const recentFeedback = feedback.slice(0, 5);

    // ── Helpers ────────────────────────────────────────
    const getInitials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // Map student_id → name for feedback display
    const studentNameMap: Record<string, string> = {};
    students.forEach((s) => { studentNameMap[s.id] = s.name; });

    // ── Loading ────────────────────────────────────────
    if (loading) {
        return (
            <DashboardLayout userRole="mentor">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    // ── Render ──────────────────────────────────────────
    return (
        <DashboardLayout userRole="mentor">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Welcome back, {userFirstName}! 👋
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Here's an overview of your students and projects.
                        </p>
                    </div>
                    <Button variant="gradient" className="gap-2" onClick={() => navigate("/feedback/new")}>
                        <Send className="h-4 w-4" />
                        Give Feedback
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Assigned Students"
                        value={uniqueStudentIds.size}
                        subtitle={`across ${projects.length} projects`}
                        icon={Users}
                        variant="primary"
                    />
                    <StatCard
                        title="Projects"
                        value={projects.length}
                        subtitle="You're assigned to"
                        icon={FolderKanban}
                        variant="accent"
                    />
                    <StatCard
                        title="Pending Feedback"
                        value={pendingCount}
                        subtitle="Awaiting response"
                        icon={Clock}
                        variant="warning"
                    />
                    <StatCard
                        title="Addressed"
                        value={addressedCount}
                        subtitle="Feedback resolved"
                        icon={CheckCircle2}
                        variant="success"
                    />
                </div>

                {/* Main Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Feedback Activity Chart */}
                    <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-semibold text-foreground">Feedback Activity</h3>
                                <p className="text-sm text-muted-foreground">Feedback given this week</p>
                            </div>
                            <Badge variant="secondary">This Week</Badge>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                                    <YAxis className="text-xs fill-muted-foreground" allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            borderColor: "hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Bar dataKey="feedback" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Feedback" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Project Status */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-semibold text-foreground mb-4">Your Projects</h3>
                        <div className="space-y-3">
                            {projects.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No projects assigned yet.
                                </p>
                            ) : (
                                projects.map((p) => {
                                    const studentCount = students.filter((s) => s.project_id === p.id).length;
                                    const fbCount = feedback.filter((f) => f.project_id === p.id).length;
                                    return (
                                        <div
                                            key={p.id}
                                            className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors"
                                            onClick={() => navigate(`/projects/${p.id}`)}
                                        >
                                            <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Users className="h-3 w-3" /> {studentCount} students
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <MessageSquare className="h-3 w-3" /> {fbCount} feedback
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Assigned Students */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Assigned Students
                        </CardTitle>
                        <CardDescription>Students under your mentorship</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {students.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <p className="text-muted-foreground">No students assigned yet.</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Students will appear here once they're added to your projects.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {students.map((student, idx) => (
                                    <div
                                        key={`${student.id}_${student.project_id}_${idx}`}
                                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                                    {getInitials(student.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-foreground">{student.name}</p>
                                                <p className="text-sm text-muted-foreground">{student.project_title}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => navigate(`/feedback/new?projectId=${student.project_id}`)}
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            Feedback
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Feedback */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    Recent Feedback
                                </CardTitle>
                                <CardDescription>Your latest feedback to students</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/feedback")}>
                                View All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentFeedback.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                                <p className="text-sm text-muted-foreground">No feedback given yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentFeedback.map((fb) => (
                                    <div
                                        key={fb.id}
                                        className="p-4 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-all"
                                        onClick={() => navigate(`/feedback/${fb.id}`)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-foreground">
                                                    {studentNameMap[fb.student_id] || "Student"}
                                                </p>
                                                <Badge
                                                    variant="outline"
                                                    className={fb.status === "pending"
                                                        ? "bg-warning/10 text-warning border-warning/20"
                                                        : "bg-success/10 text-success border-success/20"
                                                    }
                                                >
                                                    {fb.status}
                                                </Badge>
                                            </div>
                                            {fb.rating && (
                                                <div className="flex items-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <Star
                                                            key={s}
                                                            className={`h-3.5 w-3.5 ${s <= fb.rating! ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{fb.message}</p>
                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(fb.created_at)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
