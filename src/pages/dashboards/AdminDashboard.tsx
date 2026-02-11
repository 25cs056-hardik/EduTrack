import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Users,
    GraduationCap,
    FolderKanban,
    TrendingUp,
    UserPlus,
    Search,
    Shield,
    Link2,
    BarChart3,
    CheckCircle2,
    Clock,
    AlertCircle,
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
    PieChart,
    Pie,
    Cell,
} from "recharts";

// Demo data
const allUsers = [
    { id: "1", name: "Alice Johnson", email: "alice@university.edu", role: "student", status: "active", mentor: "Dr. Sarah Wilson" },
    { id: "2", name: "Bob Smith", email: "bob@university.edu", role: "student", status: "active", mentor: "Dr. Sarah Wilson" },
    { id: "3", name: "Carol White", email: "carol@university.edu", role: "student", status: "active", mentor: "Prof. James Lee" },
    { id: "4", name: "David Lee", email: "david@university.edu", role: "student", status: "away", mentor: "Unassigned" },
    { id: "5", name: "Eva Green", email: "eva@university.edu", role: "student", status: "active", mentor: "Prof. James Lee" },
    { id: "6", name: "Dr. Sarah Wilson", email: "s.wilson@university.edu", role: "mentor", status: "active", mentor: "—" },
    { id: "7", name: "Prof. James Lee", email: "j.lee@university.edu", role: "mentor", status: "active", mentor: "—" },
];

const projectCompletionData = [
    { name: "Jan", completed: 3, active: 5 },
    { name: "Feb", completed: 4, active: 6 },
    { name: "Mar", completed: 2, active: 8 },
    { name: "Apr", completed: 5, active: 7 },
    { name: "May", completed: 6, active: 4 },
];

const roleDistribution = [
    { name: "Students", value: 5, color: "hsl(var(--primary))" },
    { name: "Mentors", value: 2, color: "hsl(var(--accent))" },
    { name: "Admins", value: 1, color: "hsl(var(--warning))" },
];

const mentorAssignments = [
    { mentor: "Dr. Sarah Wilson", students: ["Alice Johnson", "Bob Smith"], capacity: 5 },
    { mentor: "Prof. James Lee", students: ["Carol White", "Eva Green"], capacity: 4 },
];

const mentorList = ["Dr. Sarah Wilson", "Prof. James Lee"];

export default function AdminDashboard() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const userFirstName = profile?.name?.split(" ")[0] || "Admin";
    const [assignOpen, setAssignOpen] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState("");
    const [selectedStudentForAssign, setSelectedStudentForAssign] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const students = allUsers.filter(u => u.role === "student");
    const mentors = allUsers.filter(u => u.role === "mentor");

    const filteredUsers = allUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAssign = () => {
        if (!selectedMentor || !selectedStudentForAssign) {
            toast({ title: "Error", description: "Please select both a mentor and student.", variant: "destructive" });
            return;
        }
        toast({
            title: "Assignment Updated",
            description: `${selectedStudentForAssign} has been assigned to ${selectedMentor}.`,
        });
        setAssignOpen(false);
        setSelectedMentor("");
        setSelectedStudentForAssign("");
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin": return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Admin</Badge>;
            case "mentor": return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Mentor</Badge>;
            default: return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Student</Badge>;
        }
    };

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
                    <div className="flex gap-3">
                        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                            <DialogTrigger asChild>
                                <Button variant="gradient" className="gap-2">
                                    <Link2 className="h-4 w-4" />
                                    Assign Mentor
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Assign Mentor to Student</DialogTitle>
                                    <DialogDescription>
                                        Link a mentor to a student for project guidance.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Student</label>
                                        <Select value={selectedStudentForAssign} onValueChange={setSelectedStudentForAssign}>
                                            <SelectTrigger><SelectValue placeholder="Select student..." /></SelectTrigger>
                                            <SelectContent>
                                                {students.map(s => (
                                                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Mentor</label>
                                        <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                                            <SelectTrigger><SelectValue placeholder="Select mentor..." /></SelectTrigger>
                                            <SelectContent>
                                                {mentorList.map(m => (
                                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button variant="outline" className="flex-1" onClick={() => setAssignOpen(false)}>Cancel</Button>
                                        <Button variant="gradient" className="flex-1" onClick={handleAssign}>Assign</Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Students"
                        value={students.length}
                        subtitle={`${students.filter(s => s.status === "active").length} active`}
                        icon={GraduationCap}
                        variant="primary"
                        trend={{ value: 10, isPositive: true }}
                    />
                    <StatCard
                        title="Total Mentors"
                        value={mentors.length}
                        subtitle="All active"
                        icon={Shield}
                        variant="accent"
                    />
                    <StatCard
                        title="Active Projects"
                        value={8}
                        subtitle="Across all teams"
                        icon={FolderKanban}
                        variant="success"
                        trend={{ value: 3, isPositive: true }}
                    />
                    <StatCard
                        title="Completion Rate"
                        value="72%"
                        subtitle="This semester"
                        icon={TrendingUp}
                        variant="warning"
                        trend={{ value: 8, isPositive: true }}
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Project Completion Chart */}
                    <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-semibold text-foreground">Project Completion Trend</h3>
                                <p className="text-sm text-muted-foreground">Monthly completed vs active projects</p>
                            </div>
                            <Badge variant="secondary">This Semester</Badge>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={projectCompletionData}>
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
                                    <Bar dataKey="completed" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Completed" />
                                    <Bar dataKey="active" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Active" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
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

                {/* Mentor-Student Assignments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5" />
                            Mentor-Student Assignments
                        </CardTitle>
                        <CardDescription>Current mentor assignments and capacity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mentorAssignments.map((assignment, i) => (
                                <div key={i} className="p-4 rounded-lg border border-border">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-blue-500/10 text-blue-500 font-semibold text-sm">
                                                    {assignment.mentor.split(" ").map(n => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-foreground">{assignment.mentor}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {assignment.students.length}/{assignment.capacity} students assigned
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 rounded-full bg-secondary">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all"
                                                    style={{ width: `${(assignment.students.length / assignment.capacity) * 100}%` }}
                                                />
                                            </div>
                                            <Badge variant="outline">{assignment.students.length}/{assignment.capacity}</Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {assignment.students.map((student) => (
                                            <Badge key={student} variant="secondary" className="gap-1">
                                                <GraduationCap className="h-3 w-3" />
                                                {student}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

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
                        <div className="space-y-3">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                                    {user.name.split(" ").map(n => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${user.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {user.role === "student" && (
                                            <span className="text-xs text-muted-foreground hidden md:block">
                                                Mentor: {user.mentor}
                                            </span>
                                        )}
                                        {getRoleBadge(user.role)}
                                        <Button variant="outline" size="sm">Manage</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
