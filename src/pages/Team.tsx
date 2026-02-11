import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Mail, Search } from "lucide-react";

const teamMembers = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@university.edu",
    role: "student",
    avatar: "",
    projects: 3,
    status: "active",
  },
  {
    id: 2,
    name: "Dr. Sarah Wilson",
    email: "s.wilson@university.edu",
    role: "mentor",
    avatar: "",
    projects: 8,
    status: "active",
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "m.johnson@university.edu",
    role: "student",
    avatar: "",
    projects: 2,
    status: "active",
  },
  {
    id: 4,
    name: "Emily Chen",
    email: "e.chen@university.edu",
    role: "student",
    avatar: "",
    projects: 4,
    status: "away",
  },
  {
    id: 5,
    name: "Prof. Robert Brown",
    email: "r.brown@university.edu",
    role: "admin",
    avatar: "",
    projects: 12,
    status: "active",
  },
];

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin":
      return "default";
    case "mentor":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusColor = (status: string) => {
  return status === "active" ? "bg-success" : "bg-warning";
};

export default function Team() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team Members</h1>
            <p className="text-muted-foreground mt-1">
              Manage your project collaborators and team
            </p>
          </div>
          <Button variant="gradient" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {teamMembers.filter((m) => m.role === "student").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {teamMembers.filter((m) => m.role === "mentor" || m.role === "admin").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Mentors & Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team List */}
        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
            <CardDescription>View and manage all team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(member.status)}`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-medium text-foreground">{member.projects} projects</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.status}</p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                      {member.role}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
