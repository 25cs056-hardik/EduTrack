import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Users, Clock, ArrowRight, BookOpen } from "lucide-react";

interface AssignedProject {
    project_id: string;
    role: string;
    project: {
        id: string;
        title: string;
        description: string;
        status: "active" | "completed" | "on_hold";
        end_date: string;
        created_at: string;
        student_name?: string;
    };
}

export default function MentorProjects() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<AssignedProject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!user) return;

            try {
                // 1. Get assignments where role is mentor
                const { data: assignments, error } = await (supabase as any)
                    .from("project_members")
                    .select(`
                        project_id,
                        role,
                        project:projects (
                            id,
                            title,
                            description,
                            status,
                            end_date,
                            created_at,
                            created_by
                        )
                    `)
                    .eq("user_id", user.id)
                    .eq("role", "mentor");

                if (error) throw error;

                const rawProjects = assignments || [];

                // 2. Fetch student names (created_by)
                const studentIds = [...new Set(rawProjects.map((p: any) => p.project?.created_by).filter(Boolean))];
                let userMap: Record<string, string> = {};

                if (studentIds.length > 0) {
                    const { data: users } = await (supabase as any)
                        .from("users")
                        .select("id, name")
                        .in("id", studentIds);

                    users?.forEach((u: any) => { userMap[u.id] = u.name; });
                }

                // 3. Attach student names
                const processed = rawProjects.map((item: any) => ({
                    ...item,
                    project: {
                        ...item.project,
                        student_name: userMap[item.project.created_by] || "Unknown Student"
                    }
                }));

                setProjects(processed);
            } catch (err) {
                console.error("Error fetching mentor projects:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-success/10 text-success border-success/20";
            case "completed": return "bg-primary/10 text-primary border-primary/20";
            case "on_hold": return "bg-warning/10 text-warning border-warning/20";
            default: return "bg-secondary text-secondary-foreground";
        }
    };

    return (
        <DashboardLayout userRole="mentor">
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Assigned Projects</h1>
                    <p className="text-muted-foreground mt-2">
                        Projects you are mentoring.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Loading projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed border-border">
                        <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-foreground">No Projects Assigned</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                            You haven't been assigned to any projects yet. Students will add you to their projects.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map(({ project }) => (
                            <Card key={project.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <Badge variant="outline" className={getStatusColor(project.status)}>
                                            {project.status.replace("_", " ")}
                                        </Badge>
                                        {project.end_date && (
                                            <div className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Due {new Date(project.end_date).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl mt-2 line-clamp-1">
                                        {project.title}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-1 mt-1">
                                        <Users className="h-3.5 w-3.5" />
                                        Student: <span className="font-medium text-foreground">{project.student_name}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col gap-4">
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {project.description || "No description provided."}
                                    </p>

                                    <div className="mt-auto pt-4">
                                        <Link to={`/projects/${project.id}`} className="w-full">
                                            <Button className="w-full gap-2" variant="outline">
                                                View Project
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
