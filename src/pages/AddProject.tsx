import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects, GitHubData } from "@/contexts/ProjectsContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitBranch, Rocket, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/** Extract owner/repo from a GitHub URL or owner/repo string */
function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
    const trimmed = input.trim().replace(/\/$/, "").replace(/\.git$/, "");
    if (trimmed.includes("github.com")) {
        const parts = trimmed.split("github.com/")[1]?.split("/");
        if (parts && parts.length >= 2 && parts[0] && parts[1]) {
            return { owner: parts[0], repo: parts[1] };
        }
    } else if (trimmed.includes("/")) {
        const parts = trimmed.split("/");
        if (parts.length >= 2 && parts[0] && parts[1]) {
            return { owner: parts[0], repo: parts[1] };
        }
    }
    return null;
}

/** Fetch real GitHub repo data from the public API */
async function fetchGitHubData(owner: string, repo: string): Promise<GitHubData> {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
    };

    const [repoRes, contributorsRes, commitsRes, branchesRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`, { headers }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`, { headers }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, { headers }),
    ]);

    if (!repoRes.ok) {
        const err = await repoRes.json().catch(() => ({}));
        throw new Error(err.message || `GitHub API error: ${repoRes.status}`);
    }

    const repoData = await repoRes.json();
    const contributorsData = contributorsRes.ok ? await contributorsRes.json() : [];
    const commitsData = commitsRes.ok ? await commitsRes.json() : [];
    const branchesData = branchesRes.ok ? await branchesRes.json() : [];

    return {
        repoName: repoData.name || repo,
        fullName: repoData.full_name || `${owner}/${repo}`,
        description: repoData.description || "",
        stars: repoData.stargazers_count || 0,
        forks: repoData.forks_count || 0,
        openIssues: repoData.open_issues_count || 0,
        defaultBranch: repoData.default_branch || "main",
        language: repoData.language || "",
        lastUpdated: repoData.updated_at
            ? new Date(repoData.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "Unknown",
        totalCommits: Array.isArray(commitsData) ? commitsData.length : 0,
        totalContributors: Array.isArray(contributorsData) ? contributorsData.length : 0,
        totalBranches: Array.isArray(branchesData) ? branchesData.length : 0,
        lastCommitDate: commitsData?.[0]?.commit?.author?.date
            ? new Date(commitsData[0].commit.author.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "Unknown",
    };
}

export default function AddProject() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { addProject } = useProjects();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [techInput, setTechInput] = useState("");
    const [technologies, setTechnologies] = useState<string[]>([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState<"active" | "on_hold">("active");
    const [githubUrl, setGithubUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const addTech = () => {
        const tech = techInput.trim();
        if (tech && !technologies.includes(tech)) {
            setTechnologies([...technologies, tech]);
            setTechInput("");
        }
    };

    const removeTech = (t: string) => {
        setTechnologies(technologies.filter((x) => x !== t));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTech();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast({ title: "Error", description: "Project title is required.", variant: "destructive" });
            return;
        }
        if (!startDate) {
            toast({ title: "Error", description: "Start date is required.", variant: "destructive" });
            return;
        }

        setSubmitting(true);

        try {
            // Fetch real GitHub data if URL provided
            let githubData: GitHubData | null = null;

            if (githubUrl.trim()) {
                const parsed = parseGitHubUrl(githubUrl);
                if (!parsed) {
                    toast({ title: "Invalid GitHub URL", description: "Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo).", variant: "destructive" });
                    setSubmitting(false);
                    return;
                }

                try {
                    githubData = await fetchGitHubData(parsed.owner, parsed.repo);
                    toast({ title: "GitHub Connected", description: `Repository "${githubData.fullName}" linked successfully.` });
                } catch (err: any) {
                    toast({ title: "GitHub Warning", description: `Could not fetch repo data: ${err.message}. Project will be created without GitHub stats.`, variant: "destructive" });
                    // Continue without GitHub data
                }
            }

            await addProject({
                title: title.trim(),
                description: description.trim(),
                technologies,
                startDate,
                dueDate: endDate || "TBD",
                status,
                githubUrl: githubUrl.trim(),
                githubData,
            });

            toast({
                title: "Project Created",
                description: `"${title}" has been created successfully.`,
            });
            navigate("/projects");
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to create project.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout userRole="student">
            <div className="w-full max-w-4xl mx-auto space-y-6">
                {/* Back button */}
                <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate("/projects")}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to Projects
                </Button>

                {/* Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Rocket className="h-6 w-6 text-primary" />
                            Create New Project
                        </CardTitle>
                        <CardDescription>
                            Fill in the details below to set up your new project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Project Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="Enter project title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="desc">Description</Label>
                                <Textarea
                                    id="desc"
                                    placeholder="Describe your project objectives, scope, and goals..."
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {/* Technologies */}
                            <div className="space-y-2">
                                <Label>Technologies Used</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g. React, Node.js, PostgreSQL"
                                        value={techInput}
                                        onChange={(e) => setTechInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <Button type="button" variant="outline" onClick={addTech}>
                                        Add
                                    </Button>
                                </div>
                                {technologies.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {technologies.map((tech) => (
                                            <Badge key={tech} variant="secondary" className="gap-1 pr-1">
                                                {tech}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTech(tech)}
                                                    className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Dates row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date">Start Date *</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date">End Date</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <Label>Project Status</Label>
                                <Select value={status} onValueChange={(v) => setStatus(v as "active" | "on_hold")}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on_hold">On Hold</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* GitHub URL */}
                            <div className="space-y-2">
                                <Label htmlFor="github-url">GitHub Repository URL</Label>
                                <div className="relative">
                                    <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="github-url"
                                        placeholder="https://github.com/username/repo"
                                        className="pl-10"
                                        value={githubUrl}
                                        onChange={(e) => setGithubUrl(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Link a GitHub repository to automatically fetch commits, contributors, and activity data.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate("/projects")}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="gradient"
                                    className="flex-1"
                                    disabled={submitting}
                                >
                                    {submitting ? "Creating..." : "Create Project"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
