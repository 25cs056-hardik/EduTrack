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
import { Input } from "@/components/ui/input";
import {
    Users,
    GraduationCap,
    FolderKanban,
    Shield,
    Search,
    MessageSquare,
    Clock,
    CheckCircle2,
    Loader2,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// ── Types ──────────────────────────────────────────────
interface UserRow {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface ProjectRow {
    id: string;
    title: string;
}

interface MemberRow {
    project_id: string;
    user_id: string;
    role: string;
}

interface MentorHierarchy {
    mentor: UserRow;
    projects: {
        project: ProjectRow;
        students: UserRow[];
    }[];
}

// ── Component ──────────────────────────────────────────
export default function AdminDashboard() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const userFirstName = profile?.name?.split(" ")[0] || "Admin";

    const [allUsers, setAllUsers] = useState<UserRow[]>([]);
    const [allProjects, setAllProjects] = useState<ProjectRow[]>([]);
    const [allMembers, setAllMembers] = useState<MemberRow[]>([]);
    const [feedbackPending, setFeedbackPending] = useState(0);
    const [feedbackAddressed, setFeedbackAddressed] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedMentors, setExpandedMentors] = useState<Set<string>>(new Set());

    // ── Data fetching ──────────────────────────────────
    useEffect(() => {
        const fetchAll = async () => {
            // All users
            const { data: usersData } = await (supabase as any)
                .from("users")
                .select("id, name, email, role");
            setAllUsers(usersData || []);

            // All projects
            const { data: projData } = await (supabase as any)
                .from("projects")
                .select("id, title");
            setAllProjects(projData || []);

            // All project_members
            const { data: membersData } = await (supabase as any)
                .from("project_members")
                .select("project_id, user_id, role");
            setAllMembers(membersData || []);

            // Feedback summary
            const { data: fbData } = await (supabase as any)
                .from("feedback")
                .select("status");
            const fbList = fbData || [];
            setFeedbackPending(fbList.filter((f: any) => f.status === "pending").length);
            setFeedbackAddressed(fbList.filter((f: any) => f.status === "addressed").length);

            setLoading(false);
        };

        fetchAll();
    }, []);

    // ── Derived data ───────────────────────────────────
    const usersMap: Record<string, UserRow> = {};
    allUsers.forEach((u) => { usersMap[u.id] = u; });

    const projectsMap: Record<string, ProjectRow> = {};
    allProjects.forEach((p) => { projectsMap[p.id] = p; });

    const students = allUsers.filter((u) => u.role === "student");
    const mentors = allUsers.filter((u) => u.role === "mentor");

    // Build mentor → project → student hierarchy using project_members.role
    const mentorHierarchy: MentorHierarchy[] = mentors.map((mentor) => {
        // Find projects where this mentor is assigned with role='mentor'
        const mentorProjectIds = allMembers
            .filter((m) => m.user_id === mentor.id && m.role === "mentor")
            .map((m) => m.project_id);

        const projects = [...new Set(mentorProjectIds)]
            .map((pid) => {
                const project = projectsMap[pid];
                if (!project) return null;

                // Find students in this project (role='student' in project_members)
                const projectStudents = allMembers
                    .filter((m) => m.project_id === pid && m.role === "student")
                    .map((m) => usersMap[m.user_id])
                    .filter(Boolean);

                return { project, students: projectStudents };
            })
            .filter(Boolean) as MentorHierarchy["projects"];

        return { mentor, projects };
    });

    // Role distribution for pie chart
    const roleDistribution = [
        { name: "Students", value: students.length, color: "hsl(var(--primary))" },
        { name: "Mentors", value: mentors.length, color: "hsl(var(--accent))" },
        { name: "Admins", value: allUsers.filter((u) => u.role === "admin").length, color: "hsl(var(--warning))" },
    ];

    // Filtered users for user management section
    const filteredUsers = allUsers.filter(
        (u) =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ── Helpers ────────────────────────────────────────
    const getInitials = (name: string) =>
        name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Admin</Badge>;
            case "mentor": return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Mentor</Badge>;
            default: return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Student</Badge>;
        }
    };

    const toggleMentor = (mentorId: string) => {
        setExpandedMentors((prev) => {
            const next = new Set(prev);
            if (next.has(mentorId)) next.delete(mentorId);
            else next.add(mentorId);
            return next;
        });
    };

    // ── Loading ────────────────────────────────────────
    if (loading) {
        return (
            <DashboardLayout userRole="admin">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    // ── Render ──────────────────────────────────────────
    return (
        <DashboardLayout userRole="admin">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Welcome back, {userFirstName}! 👋
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Admin dashboard — manage users, mentors, and platform analytics.
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Students"
                        value={students.length}
                        icon={GraduationCap}
                        variant="primary"
                    />
                    <StatCard
                        title="Total Mentors"
                        value={mentors.length}
                        icon={Shield}
                        variant="accent"
                    />
                    <StatCard
                        title="Total Projects"
                        value={allProjects.length}
                        icon={FolderKanban}
                        variant="success"
                    />
                    <StatCard
                        title="Feedback"
                        value={feedbackPending + feedbackAddressed}
                        subtitle={`${feedbackPending} pending · ${feedbackAddressed} addressed`}
                        icon={MessageSquare}
                        variant="warning"
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Mentor-Student Hierarchy */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Mentor → Project → Student
                                </CardTitle>
                                <CardDescription>Current assignments from project_members</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {mentorHierarchy.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No mentors registered yet.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {mentorHierarchy.map(({ mentor, projects: mentorProjects }) => {
                                            const isExpanded = expandedMentors.has(mentor.id);
                                            const totalStudents = mentorProjects.reduce((acc, p) => acc + p.students.length, 0);
                                            return (
                                                <div key={mentor.id} className="border border-border rounded-lg overflow-hidden">
                                                    {/* Mentor header */}
                                                    <div
                                                        className="flex items-center justify-between p-4 bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                                                        onClick={() => toggleMentor(mentor.id)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarFallback className="bg-blue-500/10 text-blue-500 text-sm font-semibold">
                                                                    {getInitials(mentor.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium text-foreground">{mentor.name}</p>
                                                                <p className="text-xs text-muted-foreground">{mentor.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {mentorProjects.length} projects
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs">
                                                                {totalStudents} students
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Expanded content */}
                                                    {isExpanded && (
                                                        <div className="p-4 pt-2 space-y-3">
                                                            {mentorProjects.length === 0 ? (
                                                                <p className="text-sm text-muted-foreground pl-8">No projects assigned.</p>
                                                            ) : (
                                                                mentorProjects.map(({ project, students: projStudents }) => (
                                                                    <div key={project.id} className="pl-8">
                                                                        <div
                                                                            className="flex items-center gap-2 mb-2 cursor-pointer hover:text-primary transition-colors"
                                                                            onClick={() => navigate(`/projects/${project.id}`)}
                                                                        >
                                                                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                                                            <span className="text-sm font-medium text-foreground">{project.title}</span>
                                                                        </div>
                                                                        {projStudents.length === 0 ? (
                                                                            <p className="text-xs text-muted-foreground pl-6">No students in this project.</p>
                                                                        ) : (
                                                                            <div className="flex flex-wrap gap-2 pl-6">
                                                                                {projStudents.map((s) => (
                                                                                    <Badge key={s.id} variant="secondary" className="gap-1">
                                                                                        <GraduationCap className="h-3 w-3" />
                                                                                        {s.name}
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Role Distribution */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-semibold text-foreground mb-4">User Distribution</h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roleDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                        labelLine={false}
                                    >
                                        {roleDistribution.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-4">
                            {roleDistribution.map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-muted-foreground">{item.name}</span>
                                    </div>
                                    <span className="font-medium text-foreground">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* User Management */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    User Management
                                </CardTitle>
                                <CardDescription>All registered users on the platform</CardDescription>
                            </div>
                        </div>
                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or role..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
                        ) : (
                            <div className="space-y-3">
                                {filteredUsers.map((u) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                                    {getInitials(u.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-foreground">{u.name}</p>
                                                <p className="text-sm text-muted-foreground">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getRoleBadge(u.role)}
                                        </div>
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
