import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GitHubData {
    repo_name: string;
    description: string;
    stars: number;
    forks: number;
    open_issues: number;
    language: string;
    last_updated: string;
    total_commits: number;
    total_contributors: number;
    total_branches: number;
    last_commit_time: string;
    last_commit_message: string;
    last_commit_author: string;
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
    mentor_feedback_enabled?: boolean;
    github_last_synced?: string | null;
}

export interface AddProjectData {
    title: string;
    description: string;
    technologies: string[];
    startDate: string;
    dueDate: string;
    status: Project["status"];
    githubRepo: string;
    githubData?: GitHubData | null;
}

export interface UpdateProjectData {
    title: string;
    description: string;
    technologies: string[];
    startDate: string;
    dueDate: string;
    status: Project["status"];
    githubRepo: string;
    githubData?: GitHubData | null;
}

export interface ProjectsContextType {
    projects: Project[];
    loading: boolean;
    addProject: (data: AddProjectData) => Promise<Project>;
    updateProject: (id: string, data: UpdateProjectData) => Promise<Project>;
    updateProjectStatus: (id: string, status: Project["status"]) => Promise<void>;
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
        mentor_feedback_enabled: row.mentor_feedback_enabled || false,
        github_last_synced: row.github_last_synced || null,
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

        if (!user) return;

        // Set up real-time subscription
        const channel = supabase
            .channel(`projects_realtime_${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "projects",
                    filter: `created_by=eq.${user.id}`,
                },
                () => {
                    console.log("Real-time project update received");
                    fetchProjects();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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

    const updateProjectStatus = async (id: string, newStatus: Project["status"]): Promise<void> => {
        const previousProjects = [...projects];
        setProjects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );

        const { error } = await (supabase as any)
            .from("projects")
            .update({ status: newStatus })
            .eq("id", id);

        if (error) {
            console.error("Supabase project status update error:", error);
            setProjects(previousProjects);
            throw new Error(error.message || "Failed to update project status.");
        }
    };

    return (
        <ProjectsContext.Provider value={{ projects, loading, addProject, updateProject, updateProjectStatus, getProject, refreshProjects }}>
            {children}
        </ProjectsContext.Provider>
    );
}

export function useProjects() {
    const ctx = useContext(ProjectsContext);
    if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
    return ctx;
}
