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
import { ArrowLeft, UserPlus, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddMember() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const { projects } = useProjects();

    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"student" | "mentor">("mentor");
    const [projectId, setProjectId] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast({ title: "Error", description: "Email is required.", variant: "destructive" });
            return;
        }
        if (!projectId) {
            toast({ title: "Error", description: "Please select a project.", variant: "destructive" });
            return;
        }
        if (!user) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        setSubmitting(true);

        try {
            // 1. Lookup user by email in the users (profiles) table
            const { data: foundUser, error: lookupErr } = await (supabase as any)
                .from("users")
                .select("id, name, role")
                .eq("email", email.trim().toLowerCase())
                .maybeSingle();

            if (lookupErr) {
                toast({ title: "Error", description: lookupErr.message, variant: "destructive" });
                return;
            }

            if (!foundUser) {
                toast({
                    title: "User Not Found",
                    description: "No registered user with that email. They must sign up first.",
                    variant: "destructive",
                });
                return;
            }

            // 2. Validate: if adding as mentor, the user should actually be a mentor
            if (role === "mentor" && foundUser.role !== "mentor" && foundUser.role !== "admin") {
                toast({
                    title: "Role Mismatch",
                    description: `${foundUser.name} is registered as "${foundUser.role}", not a mentor.`,
                    variant: "destructive",
                });
                return;
            }

            // 3. Check if already a member of this project
            const { data: existing } = await (supabase as any)
                .from("project_members")
                .select("user_id")
                .eq("project_id", projectId)
                .eq("user_id", foundUser.id)
                .maybeSingle();

            if (existing) {
                toast({
                    title: "Already a Member",
                    description: `${foundUser.name} is already assigned to this project.`,
                    variant: "destructive",
                });
                return;
            }

            // 4. Insert into project_members with role
            const { error: insertErr } = await (supabase as any)
                .from("project_members")
                .insert({
                    project_id: projectId,
                    user_id: foundUser.id,
                    role: role,
                });

            if (insertErr) {
                console.error("project_members insert error:", insertErr);
                toast({ title: "Error", description: insertErr.message || "Failed to add member.", variant: "destructive" });
                return;
            }

            // 5. Also insert into team_members for backward compat with student team view
            await (supabase as any)
                .from("team_members")
                .insert({
                    name: foundUser.name,
                    email: email.trim().toLowerCase(),
                    role: role,
                    project_id: projectId,
                    added_by: user.id,
                })
                .then(() => { /* ignore errors — team_members is supplementary */ });

            toast({
                title: "Member Added",
                description: `${foundUser.name} has been added as ${role} to the project.`,
            });
            navigate("/team");
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to add member.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
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
                            Add Member to Project
                        </CardTitle>
                        <CardDescription>
                            Look up a registered user by email and assign them to a project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Member's Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="mentor@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    The user must already have an account on the platform.
                                </p>
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label>Role in Project</Label>
                                <Select value={role} onValueChange={(v) => setRole(v as "student" | "mentor")}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="mentor">Mentor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Project selector */}
                            <div className="space-y-2">
                                <Label>Assign to Project *</Label>
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
