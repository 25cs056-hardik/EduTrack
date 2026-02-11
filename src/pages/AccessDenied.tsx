import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccessDenied() {
    const { profile } = useAuth();
    const userRole = profile?.role || "student";

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-md space-y-6">
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
                        <ShieldAlert className="h-10 w-10 text-destructive" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
                    <p className="text-muted-foreground">
                        You don't have permission to view this page. Your current role is{" "}
                        <span className="font-semibold text-foreground capitalize">{userRole}</span>.
                    </p>
                </div>
                <Link to="/dashboard">
                    <Button variant="gradient" size="lg" className="gap-2">
                        Go to My Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
