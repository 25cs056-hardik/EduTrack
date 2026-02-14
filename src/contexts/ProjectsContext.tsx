import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GitHubData {
    repoName: string;
    fullName: string;
    description: string;
    stars: number;
    forks: number;
    openIssues: number;
    defaultBranch: string;
    language: string;
    lastUpdated: string;
    totalCommits: number;
    totalContributors: number;
    totalBranches: number;
    lastCommitDate: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    status: "active" | "completed" | "on_hold";
    startDate: string;
    dueDate: string;
    technologies: string[];
    githubRepo: string;
    githubConnected: boolean;
    githubData?: GitHubData | null;
}

interface AddProjectData {
    title: string;
    description: string;
    technologies: string[];
    startDate: string;
    dueDate: string;
    status: "active" | "completed" | "on_hold";
    githubRepo: string;
    githubData?: GitHubData | null;
}

interface UpdateProjectData {
    title: string;
    description: string;
    technologies: string[];
    startDate: string;
    dueDate: string;
    status: "active" | "completed" | "on_hold";
    githubRepo: string;
    githubData?: GitHubData | null;
}

interface ProjectsContextType {
    projects: Project[];
    loading: boolean;
    addProject: (data: AddProjectData) => Promise<Project>;
    updateProject: (id: string, data: UpdateProjectData) => Promise<Project>;
    getProject: (id: string) => Project | undefined;
    refreshProjects: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

// Convert a Supabase row to our Project interface
function rowToProject(row: any): Project {
    return {
        id: row.id,
        title: row.title || "",
        description: row.description || "",
        status: row.status || "active",
        startDate: row.start_date || "",
        dueDate: row.end_date || "",
        technologies: row.technologies || [],
        githubRepo: row.github_repo || "",
        githubConnected: Boolean(row.github_repo),
        githubData: row.github_data || null,
    };
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        if (!user) {
            setProjects([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await (supabase as any)
                .from("projects")
                .select("*")
                .eq("created_by", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Failed to fetch projects:", error.message);
                setProjects([]);
            } else {
                setProjects((data || []).map(rowToProject));
            }
        } catch (err) {
            console.error("Unexpected error fetching projects:", err);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [user]);

    const addProject = async (input: AddProjectData): Promise<Project> => {
        if (!user) {
            throw new Error("You must be logged in to create a project.");
        }

        const { data, error } = await (supabase as any)
            .from("projects")
            .insert({
                created_by: user.id,
                title: input.title,
                description: input.description,
                start_date: input.startDate,
                end_date: input.dueDate,
                status: input.status,
                github_repo: input.githubRepo,
                github_data: input.githubData || null,
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase insert error FULL:", error);
            alert(`Supabase error: ${error.message}`);
            return Promise.reject(error);
        }

        const newProject = rowToProject(data);
        // Re-fetch all projects from Supabase to stay in sync
        await fetchProjects();
        return newProject;
    };

    const updateProject = async (id: string, input: UpdateProjectData): Promise<Project> => {
        if (!user) {
            throw new Error("You must be logged in to update a project.");
        }

        const { data, error } = await (supabase as any)
            .from("projects")
            .update({
                title: input.title,
                description: input.description,
                technologies: input.technologies,
                start_date: input.startDate,
                end_date: input.dueDate,
                status: input.status,
                github_repo: input.githubRepo,
                github_data: input.githubData || null,
            })
            .eq("id", id)
            .eq("created_by", user.id)
            .select()
            .single();

        if (error) {
            console.error("Failed to update project:", error.message);
            throw new Error("Failed to update project. Please try again.");
        }

        const updated = rowToProject(data);
        // Re-fetch all projects from Supabase to stay in sync
        await fetchProjects();
        return updated;
    };

    const getProject = (id: string) => projects.find((p) => p.id === id);

    const refreshProjects = async () => {
        setLoading(true);
        await fetchProjects();
    };

    return (
        <ProjectsContext.Provider value={{ projects, loading, addProject, updateProject, getProject, refreshProjects }}>
            {children}
        </ProjectsContext.Provider>
    );
}

export function useProjects() {
    const ctx = useContext(ProjectsContext);
    if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
    return ctx;
}
