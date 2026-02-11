import { createContext, useContext, useState, ReactNode } from "react";

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
}

// Seed projects
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
    },
];

interface ProjectsContextType {
    projects: Project[];
    addProject: (project: Omit<Project, "id" | "progress" | "members" | "tasksCompleted" | "totalTasks" | "githubConnected">) => Project;
    getProject: (id: string) => Project | undefined;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>(seedProjects);

    const addProject = (
        data: Omit<Project, "id" | "progress" | "members" | "tasksCompleted" | "totalTasks" | "githubConnected">
    ): Project => {
        const newProject: Project = {
            ...data,
            id: String(Date.now()),
            progress: 0,
            members: [],
            tasksCompleted: 0,
            totalTasks: 0,
            githubConnected: !!data.githubUrl,
        };
        setProjects((prev) => [newProject, ...prev]);
        return newProject;
    };

    const getProject = (id: string) => projects.find((p) => p.id === id);

    return (
        <ProjectsContext.Provider value={{ projects, addProject, getProject }}>
            {children}
        </ProjectsContext.Provider>
    );
}

export function useProjects() {
    const ctx = useContext(ProjectsContext);
    if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
    return ctx;
}
