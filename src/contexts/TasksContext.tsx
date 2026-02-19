import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "completed";

export interface Task {
    id: string;
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
    projectId: string | null;
    tags: string[];
    createdAt: string;
}

interface AddTaskData {
    title: string;
    description?: string;
    priority: TaskPriority;
    status?: TaskStatus;
    dueDate?: string;
    projectId?: string;
    tags?: string[];
}

interface UpdateTaskData {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string;
    projectId?: string;
    tags?: string[];
}

interface TasksContextType {
    tasks: Task[];
    loading: boolean;
    addTask: (data: AddTaskData) => Promise<Task>;
    updateTask: (id: string, data: UpdateTaskData) => Promise<Task>;
    updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
    refreshTasks: () => Promise<void>;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

function rowToTask(row: any): Task {
    return {
        id: row.id,
        title: row.title || "",
        description: row.description || "",
        priority: row.priority || "medium",
        status: row.status || "todo",
        dueDate: row.due_date || row.dueDate || "",
        projectId: row.project_id || null,
        tags: row.tags || [],
        createdAt: row.created_at || "",
    };
}

export function TasksProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        if (!user) {
            setTasks([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await (supabase as any)
                .from("tasks")
                .select("*")
                .eq("created_by", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Failed to fetch tasks:", error.message);
                setTasks([]);
            } else {
                setTasks((data || []).map(rowToTask));
            }
        } catch (err) {
            console.error("Unexpected error fetching tasks:", err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();

        if (!user) return;

        // Set up real-time subscription
        const channel = supabase
            .channel(`tasks_realtime_${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tasks",
                    filter: `created_by=eq.${user.id}`,
                },
                () => {
                    console.log("Real-time task update received");
                    fetchTasks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const addTask = async (input: AddTaskData): Promise<Task> => {
        if (!user) {
            throw new Error("You must be logged in to create a task.");
        }

        const insertObj: Record<string, any> = {
            title: input.title,
        };
        if (input.description) insertObj.description = input.description;
        if (input.priority) insertObj.priority = input.priority;
        if (input.status) insertObj.status = input.status;

        if (input.projectId) insertObj.project_id = input.projectId;
        if (input.tags && input.tags.length > 0) insertObj.tags = input.tags;

        console.log("Inserting task with:", insertObj);

        const { data, error } = await (supabase as any)
            .from("tasks")
            .insert(insertObj)
            .select()
            .single();

        if (error) {
            console.error("Supabase task insert error:", error);
            throw new Error(error.message || "Failed to save task.");
        }

        const newTask = rowToTask(data);
        await fetchTasks();
        return newTask;
    };

    const updateTask = async (id: string, input: UpdateTaskData): Promise<Task> => {
        if (!user) {
            throw new Error("You must be logged in to update a task.");
        }

        const updateObj: Record<string, any> = {};
        if (input.title !== undefined) updateObj.title = input.title;
        if (input.description !== undefined) updateObj.description = input.description;
        if (input.priority !== undefined) updateObj.priority = input.priority;
        if (input.status !== undefined) updateObj.status = input.status;
        if (input.dueDate !== undefined) updateObj.due_date = input.dueDate;
        if (input.projectId !== undefined) updateObj.project_id = input.projectId;
        if (input.tags !== undefined) updateObj.tags = input.tags;

        const { data, error } = await (supabase as any)
            .from("tasks")
            .update(updateObj)
            .eq("id", id)
            .eq("created_by", user.id)
            .select()
            .single();

        if (error) {
            console.error("Failed to update task:", error.message);
            throw new Error("Failed to update task. Please try again.");
        }

        const updated = rowToTask(data);
        await fetchTasks();
        return updated;
    };

    const updateTaskStatus = async (id: string, newStatus: TaskStatus): Promise<void> => {
        // Optimistic update
        const previousTasks = [...tasks];
        setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
        );

        const { error } = await (supabase as any)
            .from("tasks")
            .update({ status: newStatus })
            .eq("id", id);

        if (error) {
            console.error("Supabase status update error:", error);
            // Revert on failure
            setTasks(previousTasks);
            throw new Error(error.message || "Failed to update task status.");
        }
    };

    const refreshTasks = async () => {
        setLoading(true);
        await fetchTasks();
    };

    return (
        <TasksContext.Provider value={{ tasks, loading, addTask, updateTask, updateTaskStatus, refreshTasks }}>
            {children}
        </TasksContext.Provider>
    );
}

export function useTasks() {
    const ctx = useContext(TasksContext);
    if (!ctx) throw new Error("useTasks must be used within TasksProvider");
    return ctx;
}
