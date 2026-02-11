import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Users,
    FolderKanban,
    MessageSquare,
    Star,
    Eye,
    Send,
    Clock,
    CheckCircle2,
    TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// Demo data
const assignedStudents = [
    { id: "1", name: "Alice Johnson", project: "E-Commerce Platform", progress: 75, lastActive: "2 hours ago", status: "active" },
    { id: "2", name: "Bob Smith", project: "ML Research Paper", progress: 45, lastActive: "1 day ago", status: "active" },
    { id: "3", name: "Carol White", project: "Mobile App Development", progress: 90, lastActive: "30 min ago", status: "active" },
    { id: "4", name: "David Lee", project: "Data Visualization Tool", progress: 30, lastActive: "3 days ago", status: "away" },
    { id: "5", name: "Eva Green", project: "Cloud Infrastructure", progress: 60, lastActive: "5 hours ago", status: "active" },
];

const projectsToReview = [
    { id: "1", title: "E-Commerce Platform", student: "Alice Johnson", progress: 75, tasksCompleted: 18, totalTasks: 24, dueDate: "Mar 15, 2024", status: "on_track" },
    { id: "2", title: "ML Research Paper", student: "Bob Smith", progress: 45, tasksCompleted: 9, totalTasks: 20, dueDate: "Apr 20, 2024", status: "at_risk" },
    { id: "3", title: "Mobile App Development", student: "Carol White", progress: 90, tasksCompleted: 27, totalTasks: 30, dueDate: "Feb 28, 2024", status: "ahead" },
];

const recentFeedback = [
    { id: "1", student: "Alice Johnson", project: "E-Commerce Platform", content: "Great progress on the authentication module. Consider adding rate limiting.", date: "Jan 10, 2024", rating: 4 },
    { id: "2", student: "Carol White", project: "Mobile App Development", content: "Excellent UI implementation. The navigation flow is very intuitive.", date: "Jan 9, 2024", rating: 5 },
    { id: "3", student: "Bob Smith", project: "ML Research Paper", content: "Literature review needs more recent papers. Check 2023 publications.", date: "Jan 8, 2024", rating: 3 },
];

const weeklyReviewData = [
    { name: "Mon", reviews: 3 },
    { name: "Tue", reviews: 5 },
    { name: "Wed", reviews: 2 },
    { name: "Thu", reviews: 4 },
    { name: "Fri", reviews: 6 },
    { name: "Sat", reviews: 1 },
    { name: "Sun", reviews: 0 },
];

export default function MentorDashboard() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const userFirstName = profile?.name?.split(" ")[0] || "Mentor";
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [selectedStudent, setSelectedStudent] = useState("");

    const handleSubmitFeedback = () => {
        if (!feedbackText.trim()) {
            toast({ title: "Error", description: "Please enter feedback.", variant: "destructive" });
            return;
        }
        toast({ title: "Feedback Sent", description: `Feedback sent to ${selectedStudent}.` });
        setFeedbackText("");
        setFeedbackOpen(false);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ahead": return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ahead</Badge>;
            case "on_track": return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">On Track</Badge>;
            case "at_risk": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">At Risk</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

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
                    <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                        <DialogTrigger asChild>
                            <Button variant="gradient" className="gap-2">
                                <Send className="h-4 w-4" />
                                Give Feedback
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Send Feedback</DialogTitle>
                                <DialogDescription>
                                    Provide feedback to one of your assigned students.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Student</label>
                                    <select
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                        value={selectedStudent}
                                        onChange={(e) => setSelectedStudent(e.target.value)}
                                    >
                                        <option value="">Select a student...</option>
                                        {assignedStudents.map(s => (
                                            <option key={s.id} value={s.name}>{s.name} — {s.project}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Feedback</label>
                                    <Textarea
                                        placeholder="Write your feedback here..."
                                        rows={4}
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setFeedbackOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="gradient" className="flex-1" onClick={handleSubmitFeedback}>
                                        Send Feedback
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Assigned Students"
                        value={assignedStudents.length}
                        subtitle={`${assignedStudents.filter(s => s.status === "active").length} active`}
                        icon={Users}
                        variant="primary"
                    />
                    <StatCard
                        title="Projects Reviewing"
                        value={projectsToReview.length}
                        subtitle="Across all students"
                        icon={FolderKanban}
                        variant="accent"
                    />
                    <StatCard
                        title="Feedback Given"
                        value={recentFeedback.length}
                        subtitle="This week"
                        icon={MessageSquare}
                        variant="success"
                        trend={{ value: 15, isPositive: true }}
                    />
                    <StatCard
                        title="Avg Student Progress"
                        value="60%"
                        subtitle="Across all projects"
                        icon={TrendingUp}
                        variant="warning"
                        trend={{ value: 5, isPositive: true }}
                    />
                </div>

                {/* Main Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Review Activity Chart */}
                    <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-semibold text-foreground">Review Activity</h3>
                                <p className="text-sm text-muted-foreground">Reviews completed this week</p>
                            </div>
                            <Badge variant="secondary">This Week</Badge>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyReviewData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                    <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                                    <YAxis className="text-xs fill-muted-foreground" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            borderColor: "hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Bar dataKey="reviews" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Reviews" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <h3 className="font-semibold text-foreground mb-4">Project Status</h3>
                        <div className="space-y-4">
                            {projectsToReview.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                                        <p className="text-xs text-muted-foreground">{p.student}</p>
                                    </div>
                                    {getStatusBadge(p.status)}
                                </div>
                            ))}
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
                        <div className="space-y-3">
                            {assignedStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src="" />
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                                    {student.name.split(" ").map(n => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${student.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{student.name}</p>
                                            <p className="text-sm text-muted-foreground">{student.project}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden md:block">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 rounded-full bg-secondary">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{ width: `${student.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-foreground">{student.progress}%</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                                                <Clock className="h-3 w-3" />
                                                {student.lastActive}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" className="gap-1">
                                            <Eye className="h-3.5 w-3.5" />
                                            Review
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Feedback */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Recent Feedback Given
                        </CardTitle>
                        <CardDescription>Your latest feedback to students</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentFeedback.map((fb) => (
                                <div key={fb.id} className="p-4 rounded-lg border border-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-foreground">{fb.student}</p>
                                            <span className="text-muted-foreground">·</span>
                                            <p className="text-sm text-muted-foreground">{fb.project}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`h-3.5 w-3.5 ${i < fb.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
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
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
