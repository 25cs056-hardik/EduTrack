import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: "student" | "mentor" | "admin";
}

export function DashboardLayout({ children, userRole = "student" }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar userRole={userRole} />
      <main className="pl-64 transition-all duration-300">
        <div className="min-h-screen p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}