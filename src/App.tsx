import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectsProvider } from "@/contexts/ProjectsContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import AddProject from "./pages/AddProject";
import EditProject from "./pages/EditProject";
import ProjectDetails from "./pages/ProjectDetails";
import Tasks from "./pages/Tasks";
import AddTask from "./pages/AddTask";
import GitHubAnalytics from "./pages/GitHubAnalytics";
import Feedback from "./pages/Feedback";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProjectsProvider>
        <TasksProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/access-denied" element={<AccessDenied />} />

                {/* All authenticated roles */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/team" element={
                  <ProtectedRoute>
                    <Team />
                  </ProtectedRoute>
                } />

                {/* Student only */}
                <Route path="/projects" element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <Projects />
                  </ProtectedRoute>
                } />
                <Route path="/projects/new" element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <AddProject />
                  </ProtectedRoute>
                } />
                <Route path="/tasks" element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <Tasks />
                  </ProtectedRoute>
                } />
                <Route path="/tasks/new" element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <AddTask />
                  </ProtectedRoute>
                } />
                <Route path="/github" element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <GitHubAnalytics />
                  </ProtectedRoute>
                } />

                {/* Project details — all roles can view */}
                <Route path="/projects/:id" element={
                  <ProtectedRoute>
                    <ProjectDetails />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:id/edit" element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <EditProject />
                  </ProtectedRoute>
                } />

                {/* Student + Mentor */}
                <Route path="/feedback" element={
                  <ProtectedRoute allowedRoles={["student", "mentor"]}>
                    <Feedback />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </TasksProvider>
      </ProjectsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;