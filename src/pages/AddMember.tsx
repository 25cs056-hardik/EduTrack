import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/contexts/ProjectsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddMember() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const { projects } = useProjects();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"student" | "mentor" | "admin">("student");
    const [projectId, setProjectId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({ title: "Error", description: "Full name is required.", variant: "destructive" });
            return;
        }
        if (!email.trim()) {
            toast({ title: "Error", description: "Email is required.", variant: "destructive" });
            return;
        }
        if (!user) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        setSubmitting(true);

        try {
            const insertObj: Record<string, any> = {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                role,
                added_by: user.id,
            };
            if (projectId) insertObj.project_id = projectId;

            const { error } = await (supabase as any)
                .from("team_members")
                .insert(insertObj);

            if (error) {
                console.error("Supabase team_members insert error:", error);
                toast({ title: "Error", description: error.message || "Failed to add member.", variant: "destructive" });
                return;
            }

            toast({
                title: "Member Added",
                description: `${name} has been added to the team.`,
            });
            navigate("/team");
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to add member.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout userRole="student">
            <div className="w-full max-w-xl mx-auto space-y-6">
                {/* Back button */}
                <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate("/team")}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to Team
                </Button>

                {/* Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <UserPlus className="h-6 w-6 text-primary" />
                            Add Member
                        </CardTitle>
                        <CardDescription>
                            Add a new member to your team.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter member's full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="member@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select value={role} onValueChange={(v) => setRole(v as "student" | "mentor" | "admin")}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="mentor">Mentor</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Project selector */}
                            {projects.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Assign to Project (optional)</Label>
                                    <Select value={projectId} onValueChange={setProjectId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a project" />
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
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate("/team")}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="gradient"
                                    className="flex-1"
                                    disabled={submitting}
                                >
                                    {submitting ? "Adding..." : "Add Member"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
