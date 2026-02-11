import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: "student" | "mentor" | "admin";
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        // Try fetching from public.users table first
        const { data, error } = await (supabase as any)
            .from("users")
            .select("id, name, email, role")
            .eq("id", userId)
            .maybeSingle();

        if (data && !error) {
            setProfile(data as UserProfile);
        } else {
            // Fallback: build profile from auth metadata
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                setProfile({
                    id: authUser.id,
                    name: authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
                    email: authUser.email || "",
                    role: authUser.user_metadata?.role || "student",
                });
            }
        }
    };

    const refreshProfile = async () => {
        if (user?.id) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession?.user) {
                fetchProfile(currentSession.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);
                if (newSession?.user) {
                    fetchProfile(newSession.user.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
