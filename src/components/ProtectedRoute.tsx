import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ("student" | "mentor" | "admin")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { session, profile, loading } = useAuth();

    // Still loading auth state — show nothing to avoid flash
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    // Not logged in — redirect to auth
    if (!session) {
        return <Navigate to="/auth" replace />;
    }

    // Role check: if allowedRoles specified and user's role isn't in the list
    if (allowedRoles && profile) {
        const userRole = profile.role || "student";
        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/access-denied" replace />;
        }
    }

    return <>{children}</>;
}
