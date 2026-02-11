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
    progress: number;
    status: "active" | "completed" | "on_hold";
    startDate: string;
    dueDate: string;
    technologies: string[];
    githubUrl: string;
    members: { name: string; avatar?: string }[];
    tasksCompleted: number;
    totalTasks: number;
    githubConnected: boolean;
    githubData?: GitHubData | null;
}

// Seed projects used as fallback when Supabase table is unavailable
const seedProjects: Project[] = [
    {
        id: "1",
        title: "E-Commerce Platform Development",
        description:
            "Building a full-stack e-commerce solution with React and Node.js. The platform includes user authentication, product management, shopping cart, payment integration with Stripe, order tracking, and an admin dashboard for inventory management.",
        progress: 75,
        status: "active",
        startDate: "Oct 1, 2023",
        dueDate: "Mar 15, 2024",
        technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "Tailwind CSS"],
        githubUrl: "https://github.com/alice/ecommerce-platform",
        members: [
            { name: "Alice Johnson" },
            { name: "Bob Smith" },
            { name: "Carol White" },
        ],
        tasksCompleted: 18,
        totalTasks: 24,
        githubConnected: true,
        githubData: null,
    },
    {
        id: "2",
        title: "Machine Learning Research Paper",
        description:
            "Research on deep learning applications in healthcare, focusing on medical image classification using CNNs. Includes dataset preparation, model training, evaluation, and paper writing for publication.",
        progress: 45,
        status: "active",
        startDate: "Nov 15, 2023",
        dueDate: "Apr 20, 2024",
        technologies: ["Python", "TensorFlow", "Jupyter", "LaTeX"],
        githubUrl: "",
        members: [{ name: "David Lee" }, { name: "Eva Green" }],
        tasksCompleted: 9,
        totalTasks: 20,
        githubConnected: false,
        githubData: null,
    },
    {
        id: "3",
        title: "Mobile App for Campus Events",
        description:
            "React Native app for managing and discovering campus events. Features include event creation, RSVP, push notifications, calendar integration, and social sharing capabilities.",
        progress: 100,
        status: "completed",
        startDate: "Aug 1, 2023",
        dueDate: "Jan 10, 2024",
        technologies: ["React Native", "Firebase", "Expo", "TypeScript"],
        githubUrl: "https://github.com/frank/campus-events",
        members: [
            { name: "Frank Miller" },
            { name: "Grace Lee" },
            { name: "Henry Wilson" },
        ],
        tasksCompleted: 32,
        totalTasks: 32,
        githubConnected: true,
        githubData: null,
    },
    {
        id: "4",
        title: "AI Chatbot for Student Support",
        description:
            "Implementing an AI-powered chatbot to assist students with academic queries, course registration, and campus navigation. Uses NLP for understanding and generating responses.",
        progress: 20,
        status: "on_hold",
        startDate: "Jan 5, 2024",
        dueDate: "May 30, 2024",
        technologies: ["Python", "OpenAI API", "FastAPI", "React"],
        githubUrl: "https://github.com/ivy/student-chatbot",
        members: [{ name: "Ivy Chen" }],
        tasksCompleted: 4,
        totalTasks: 20,
        githubConnected: true,
        githubData: null,
    },
];

interface AddProjectData {
    title: string;
    description: string;
    technologies: string[];
    startDate: string;
    dueDate: string;
    status: "active" | "completed" | "on_hold";
    githubUrl: string;
    githubData?: GitHubData | null;
}

interface ProjectsContextType {
    projects: Project[];
    loading: boolean;
    addProject: (data: AddProjectData) => Promise<Project>;
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
        progress: row.progress || 0,
        status: row.status || "active",
        startDate: row.start_date || "",
        dueDate: row.due_date || "",
        technologies: row.technologies || [],
        githubUrl: row.github_url || "",
        members: [],
        tasksCompleted: row.tasks_completed || 0,
        totalTasks: row.total_tasks || 0,
        githubConnected: !!(row.github_url),
        githubData: row.github_data || null,
    };
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>(seedProjects);
    const [loading, setLoading] = useState(true);
    const [usingDB, setUsingDB] = useState(false);

    const fetchProjects = async () => {
        if (!user) {
            setProjects(seedProjects);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await (supabase as any)
                .from("projects")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                // Table doesn't exist or RLS issue — fall back to seed data
                console.warn("Projects table not available, using seed data:", error.message);
                setUsingDB(false);
                setProjects(seedProjects);
            } else {
                setUsingDB(true);
                const fetched = (data || []).map(rowToProject);
                // If user has no projects yet, show seed data as examples
                setProjects(fetched.length > 0 ? fetched : seedProjects);
            }
        } catch {
            setUsingDB(false);
            setProjects(seedProjects);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [user]);

    const addProject = async (input: AddProjectData): Promise<Project> => {
        if (usingDB && user) {
            // Insert into Supabase
            const { data, error } = await (supabase as any)
                .from("projects")
                .insert({
                    user_id: user.id,
                    title: input.title,
                    description: input.description,
                    technologies: input.technologies,
                    start_date: input.startDate,
                    due_date: input.dueDate,
                    status: input.status,
                    github_url: input.githubUrl,
                    github_data: input.githubData || null,
                    progress: 0,
                    tasks_completed: 0,
                    total_tasks: 0,
                })
                .select()
                .single();

            if (error) {
                console.error("Failed to insert project:", error.message);
                throw new Error("Failed to save project. Please try again.");
            }

            const newProject = rowToProject(data);
            setProjects((prev) => {
                // If currently showing seed data, replace it with just the new project
                const wasSeed = prev === seedProjects;
                return wasSeed ? [newProject] : [newProject, ...prev];
            });
            return newProject;
        }

        // Fallback: add to local state only
        const newProject: Project = {
            id: String(Date.now()),
            title: input.title,
            description: input.description,
            progress: 0,
            status: input.status,
            startDate: input.startDate,
            dueDate: input.dueDate,
            technologies: input.technologies,
            githubUrl: input.githubUrl,
            members: [],
            tasksCompleted: 0,
            totalTasks: 0,
            githubConnected: !!input.githubUrl,
            githubData: input.githubData || null,
        };
        setProjects((prev) => [newProject, ...prev]);
        return newProject;
    };

    const getProject = (id: string) => projects.find((p) => p.id === id);

    const refreshProjects = async () => {
        setLoading(true);
        await fetchProjects();
    };

    return (
        <ProjectsContext.Provider value={{ projects, loading, addProject, getProject, refreshProjects }}>
            {children}
        </ProjectsContext.Provider>
    );
}

export function useProjects() {
    const ctx = useContext(ProjectsContext);
    if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
    return ctx;
}
