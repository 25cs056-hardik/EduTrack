import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserPlus,
  Mail,
  Search,
  FolderKanban,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Loader2,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ──────────────────────────────────────────────
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  project_id: string | null;
  created_at: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ProjectRow {
  id: string;
  title: string;
}

interface MemberRow {
  project_id: string;
  user_id: string;
  role: string;
}

// ── Helpers ────────────────────────────────────────────
const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin": return "default" as const;
    case "mentor": return "secondary" as const;
    default: return "outline" as const;
  }
};

// ── Student Team View (existing team_members table) ────
function StudentTeamView() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      if (!user) { setMembers([]); setLoading(false); return; }
      try {
        const { data, error } = await (supabase as any)
          .from("team_members")
          .select("*")
          .eq("added_by", user.id)
          .order("created_at", { ascending: false });
        if (error) { console.error(error); setMembers([]); }
        else setMembers(data || []);
      } catch { setMembers([]); }
      finally { setLoading(false); }
    };
    fetchMembers();
  }, [user]);

  const filteredMembers = members.filter(
    (m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Members</h1>
          <p className="text-muted-foreground mt-1">Manage your project collaborators and team</p>
        </div>
        <Link to="/team/add">
          <Button variant="gradient" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search team members..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{members.length}</p><p className="text-sm text-muted-foreground">Total Members</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center"><Users className="h-6 w-6 text-accent" /></div><div><p className="text-2xl font-bold text-foreground">{members.filter(m => m.role === "student").length}</p><p className="text-sm text-muted-foreground">Students</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center"><Users className="h-6 w-6 text-warning" /></div><div><p className="text-2xl font-bold text-foreground">{members.filter(m => m.role === "mentor" || m.role === "admin").length}</p><p className="text-sm text-muted-foreground">Mentors & Admins</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Members</CardTitle>
          <CardDescription>View and manage all team members</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No team members yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first team member to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{member.email}</p>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">{member.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Mentor Team View (students grouped by project) ─────
function MentorTeamView() {
  const { user } = useAuth();
  const [projectGroups, setProjectGroups] = useState<{ project: ProjectRow; students: UserRow[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetch = async () => {
      if (!user) { setLoading(false); return; }

      // Get mentor's projects
      const { data: myMembers } = await (supabase as any)
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id)
        .eq("role", "mentor");

      const projectIds = [...new Set((myMembers || []).map((m: any) => m.project_id))] as string[];
      if (projectIds.length === 0) { setLoading(false); return; }

      // Fetch project titles
      const { data: projData } = await (supabase as any)
        .from("projects")
        .select("id, title")
        .in("id", projectIds);
      const projMap: Record<string, ProjectRow> = {};
      (projData || []).forEach((p: any) => { projMap[p.id] = p; });

      // Fetch all members of those projects
      const { data: allMembers } = await (supabase as any)
        .from("project_members")
        .select("project_id, user_id, role")
        .in("project_id", projectIds);

      const memberIds = [...new Set((allMembers || []).map((m: any) => m.user_id))] as string[];
      let usersMap: Record<string, UserRow> = {};
      if (memberIds.length > 0) {
        const { data: usersData } = await (supabase as any)
          .from("users")
          .select("id, name, email, role")
          .in("id", memberIds);
        (usersData || []).forEach((u: any) => { usersMap[u.id] = u; });
      }

      // Build groups — only show students
      const groups = projectIds
        .map((pid) => {
          const project = projMap[pid];
          if (!project) return null;
          const students = (allMembers || [])
            .filter((m: any) => m.project_id === pid && m.role === "student")
            .map((m: any) => usersMap[m.user_id])
            .filter(Boolean);
          return { project, students };
        })
        .filter(Boolean) as { project: ProjectRow; students: UserRow[] }[];

      setProjectGroups(groups);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalStudents = new Set(projectGroups.flatMap((g) => g.students.map((s) => s.id))).size;

  const filteredGroups = projectGroups.map((g) => ({
    ...g,
    students: g.students.filter(
      (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((g) => searchQuery === "" || g.students.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Students</h1>
        <p className="text-muted-foreground mt-1">Students assigned to your projects</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search students..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><GraduationCap className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{totalStudents}</p><p className="text-sm text-muted-foreground">Total Students</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center"><FolderKanban className="h-6 w-6 text-accent" /></div><div><p className="text-2xl font-bold text-foreground">{projectGroups.length}</p><p className="text-sm text-muted-foreground">Your Projects</p></div></div></CardContent></Card>
      </div>

      {filteredGroups.length === 0 ? (
        <Card className="py-12">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No students yet</p>
            <p className="text-sm mt-1">Students will appear once they're added to your projects.</p>
          </div>
        </Card>
      ) : (
        filteredGroups.map(({ project, students }) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderKanban className="h-5 w-5 text-primary" />
                {project.title}
              </CardTitle>
              <CardDescription>{students.length} student{students.length !== 1 ? "s" : ""}</CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No students in this project.</p>
              ) : (
                <div className="space-y-3">
                  {students.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{getInitials(s.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{s.name}</p>
                          <p className="text-sm text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Student</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ── Admin Team View (mentor → project → student) ───────
function AdminTeamView() {
  const [mentorHierarchy, setMentorHierarchy] = useState<{ mentor: UserRow; projects: { project: ProjectRow; students: UserRow[] }[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMentors, setExpandedMentors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetch = async () => {
      const { data: usersData } = await (supabase as any).from("users").select("id, name, email, role");
      const { data: projData } = await (supabase as any).from("projects").select("id, title");
      const { data: membersData } = await (supabase as any).from("project_members").select("project_id, user_id, role");

      const users: UserRow[] = usersData || [];
      const projects: ProjectRow[] = projData || [];
      const members: MemberRow[] = membersData || [];

      const usersMap: Record<string, UserRow> = {};
      users.forEach((u) => { usersMap[u.id] = u; });
      const projMap: Record<string, ProjectRow> = {};
      projects.forEach((p) => { projMap[p.id] = p; });

      const mentors = users.filter((u) => u.role === "mentor");
      const hierarchy = mentors.map((mentor) => {
        const mentorProjectIds = [...new Set(members.filter((m) => m.user_id === mentor.id && m.role === "mentor").map((m) => m.project_id))];
        const mentorProjects = mentorProjectIds
          .map((pid) => {
            const project = projMap[pid];
            if (!project) return null;
            const projStudents = members
              .filter((m) => m.project_id === pid && m.role === "student")
              .map((m) => usersMap[m.user_id])
              .filter(Boolean);
            return { project, students: projStudents };
          })
          .filter(Boolean) as { project: ProjectRow; students: UserRow[] }[];
        return { mentor, projects: mentorProjects };
      });

      setMentorHierarchy(hierarchy);
      // Expand all by default
      setExpandedMentors(new Set(mentors.map((m) => m.id)));
      setLoading(false);
    };
    fetch();
  }, []);

  const toggleMentor = (id: string) => {
    setExpandedMentors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalMentors = mentorHierarchy.length;
  const totalStudents = new Set(mentorHierarchy.flatMap((m) => m.projects.flatMap((p) => p.students.map((s) => s.id)))).size;
  const totalProjects = new Set(mentorHierarchy.flatMap((m) => m.projects.map((p) => p.project.id))).size;

  // Filter by search
  const filtered = mentorHierarchy
    .map((mh) => ({
      ...mh,
      projects: mh.projects.map((pg) => ({
        ...pg,
        students: pg.students.filter(
          (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })),
    }))
    .filter(
      (mh) =>
        searchQuery === "" ||
        mh.mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mh.projects.some((pg) => pg.students.length > 0 || pg.project.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Overview</h1>
        <p className="text-muted-foreground mt-1">Read-only hierarchical view of all mentors, projects, and students</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search mentors, projects, or students..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center"><Shield className="h-6 w-6 text-blue-500" /></div><div><p className="text-2xl font-bold text-foreground">{totalMentors}</p><p className="text-sm text-muted-foreground">Mentors</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center"><FolderKanban className="h-6 w-6 text-accent" /></div><div><p className="text-2xl font-bold text-foreground">{totalProjects}</p><p className="text-sm text-muted-foreground">Projects</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center"><GraduationCap className="h-6 w-6 text-emerald-500" /></div><div><p className="text-2xl font-bold text-foreground">{totalStudents}</p><p className="text-sm text-muted-foreground">Students</p></div></div></CardContent></Card>
      </div>

      {filtered.length === 0 ? (
        <Card className="py-12">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No mentors found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(({ mentor, projects: mentorProjects }) => {
            const isExpanded = expandedMentors.has(mentor.id);
            const totalStudentsInMentor = mentorProjects.reduce((acc, p) => acc + p.students.length, 0);
            return (
              <Card key={mentor.id} className="overflow-hidden">
                {/* Mentor header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => toggleMentor(mentor.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-500/10 text-blue-500 font-semibold text-sm">{getInitials(mentor.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{mentor.name}</p>
                      <p className="text-xs text-muted-foreground">{mentor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">Mentor</Badge>
                    <Badge variant="outline" className="text-xs">{mentorProjects.length} projects</Badge>
                    <Badge variant="outline" className="text-xs">{totalStudentsInMentor} students</Badge>
                  </div>
                </div>

                {/* Expanded projects + students */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {mentorProjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground pl-12">No projects assigned.</p>
                    ) : (
                      mentorProjects.map(({ project, students }) => (
                        <div key={project.id} className="pl-12 border-l-2 border-border ml-5">
                          <div className="flex items-center gap-2 mb-2 pl-4">
                            <FolderKanban className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium text-foreground">{project.title}</span>
                            <span className="text-xs text-muted-foreground">({students.length} students)</span>
                          </div>
                          {students.length > 0 && (
                            <div className="flex flex-wrap gap-2 pl-10">
                              {students.map((s) => (
                                <Badge key={s.id} variant="secondary" className="gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  {s.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Team Component ────────────────────────────────
export default function Team() {
  const { profile, loading: authLoading } = useAuth();
  const userRole = profile?.role || "student";

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {userRole === "admin" ? (
        <AdminTeamView />
      ) : userRole === "mentor" ? (
        <MentorTeamView />
      ) : (
        <StudentTeamView />
      )}
    </DashboardLayout>
  );
}
