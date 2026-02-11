import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: "student" | "mentor" | "admin";
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { profile } = useAuth();
  const effectiveRole = userRole || profile?.role || "student";

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar userRole={effectiveRole} />
      <main className="pl-64 transition-all duration-300">
        <div className="min-h-screen p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}