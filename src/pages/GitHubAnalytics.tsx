import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  GitBranch,
  GitCommit,
  Users,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Activity,
  Code2,
  FileCode,
  Star,
  GitFork,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Language colors mapping
const languageColors: Record<string, string> = {
  TypeScript: "hsl(var(--primary))",
  JavaScript: "hsl(var(--warning))",
  CSS: "hsl(var(--accent))",
  HTML: "hsl(var(--destructive))",
  Python: "hsl(142 76% 36%)",
  Java: "hsl(25 95% 53%)",
  Go: "hsl(199 89% 48%)",
  Rust: "hsl(16 100% 50%)",
  Other: "hsl(var(--muted-foreground))",
};

interface GitHubData {
  repo: {
    name: string;
    fullName: string;
    description: string;
    stars: number;
    forks: number;
    openIssues: number;
    defaultBranch: string;
    language: string;
    lastUpdated: string;
  };
  stats: {
    totalCommits: number;
    totalContributors: number;
    totalBranches: number;
    lastCommit: string;
  };
  commitActivity: { week: string; commits: number }[];
  recentCommits: {
    sha: string;
    message: string;
    author: string;
    avatar: string;
    date: string;
    branch: string;
  }[];
  contributors: {
    name: string;
    avatar: string;
    commits: number;
    additions: number;
    deletions: number;
  }[];
  languages: { name: string; value: number }[];
}

export default function GitHubAnalytics() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GitHubData | null>(null);
  const { toast } = useToast();

  const fetchGitHubData = async () => {
    if (!repoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a GitHub repository URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse owner/repo from URL
      let owner = '';
      let repo = '';
      const trimmedUrl = repoUrl.trim().replace(/\/$/, '');

      if (trimmedUrl.includes('github.com')) {
        const parts = trimmedUrl.split('github.com/')[1]?.split('/');
        if (!parts || parts.length < 2) throw new Error('Invalid GitHub URL format');
        owner = parts[0];
        repo = parts[1].replace('.git', '');
      } else {
        const parts = trimmedUrl.split('/');
        if (parts.length >= 2) {
          owner = parts[0];
          repo = parts[1];
        }
      }

      if (!owner || !repo) {
        throw new Error('Invalid repository URL. Use https://github.com/owner/repo');
      }

      const ghHeaders: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
      };

      // Fetch repo info
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: ghHeaders });
      if (!repoRes.ok) {
        const errBody = await repoRes.json().catch(() => ({}));
        throw new Error(errBody.message || `GitHub API error: ${repoRes.status}`);
      }
      const repoData = await repoRes.json();

      // Fetch contributors, commits, languages, branches in parallel
      const [contributorsRes, commitsRes, languagesRes, branchesRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`, { headers: ghHeaders }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`, { headers: ghHeaders }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers: ghHeaders }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, { headers: ghHeaders }),
      ]);

      const contributorsData = contributorsRes.ok ? await contributorsRes.json() : [];
      const commitsData = commitsRes.ok ? await commitsRes.json() : [];
      const languagesRaw = languagesRes.ok ? await languagesRes.json() : {};
      const branchesData = branchesRes.ok ? await branchesRes.json() : [];

      // Process languages into percentages
      const totalBytes = Object.values(languagesRaw as Record<string, number>).reduce((sum: number, val: number) => sum + val, 0);
      const languages = Object.entries(languagesRaw as Record<string, number>).map(([name, bytes]) => ({
        name,
        value: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
      }));

      // Process recent commits
      const recentCommits = (Array.isArray(commitsData) ? commitsData : []).slice(0, 10).map((c: any) => ({
        sha: c.sha?.substring(0, 7) || '',
        message: c.commit?.message?.split('\n')[0] || 'No message',
        author: c.commit?.author?.name || c.author?.login || 'Unknown',
        avatar: c.author?.avatar_url || '',
        date: c.commit?.author?.date
          ? new Date(c.commit.author.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Unknown',
        branch: repoData.default_branch || 'main',
      }));

      // Process contributors
      const contributors = (Array.isArray(contributorsData) ? contributorsData : []).map((c: any) => ({
        name: c.login || 'Unknown',
        avatar: c.avatar_url || '',
        commits: c.contributions || 0,
        additions: 0,
        deletions: 0,
      }));

      // Build daily commit activity from recent commits
      const weekMap: Record<string, number> = {};
      for (const c of (Array.isArray(commitsData) ? commitsData : [])) {
        const date = c.commit?.author?.date ? new Date(c.commit.author.date) : null;
        if (date) {
          const weekLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          weekMap[weekLabel] = (weekMap[weekLabel] || 0) + 1;
        }
      }
      const commitActivity = Object.entries(weekMap)
        .map(([week, commits]) => ({ week, commits }))
        .reverse();

      const result: GitHubData = {
        repo: {
          name: repoData.name || repo,
          fullName: repoData.full_name || `${owner}/${repo}`,
          description: repoData.description || '',
          stars: repoData.stargazers_count || 0,
          forks: repoData.forks_count || 0,
          openIssues: repoData.open_issues_count || 0,
          defaultBranch: repoData.default_branch || 'main',
          language: repoData.language || '',
          lastUpdated: repoData.updated_at
            ? new Date(repoData.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Unknown',
        },
        stats: {
          totalCommits: Array.isArray(commitsData) ? commitsData.length : 0,
          totalContributors: Array.isArray(contributorsData) ? contributorsData.length : 0,
          totalBranches: Array.isArray(branchesData) ? branchesData.length : 0,
          lastCommit: commitsData?.[0]?.commit?.author?.date
            ? new Date(commitsData[0].commit.author.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Unknown',
        },
        commitActivity,
        recentCommits,
        contributors,
        languages,
      };

      setData(result);
      setIsConnected(true);
      toast({
        title: "Connected",
        description: `Successfully connected to ${result.repo.fullName}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch repository data';
      setError(message);
      setIsConnected(false);
      toast({
        title: "Connection Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (repoUrl) {
      fetchGitHubData();
    }
  };

  // Assign colors to languages
  const languagesWithColors = data?.languages.map((lang) => ({
    ...lang,
    color: languageColors[lang.name] || languageColors.Other,
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">GitHub Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track repository activity and contributions (read-only)
            </p>
          </div>
          {isConnected && (
            <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          )}
        </div>

        {/* Repository Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Connect Repository
            </CardTitle>
            <CardDescription>
              Link a public GitHub repository to track commits and contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && fetchGitHubData()}
                />
              </div>
              <Button variant="gradient" onClick={fetchGitHubData} disabled={isLoading}>
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : isConnected ? (
                  "Reconnect"
                ) : (
                  "Connect"
                )}
              </Button>
              {isConnected && data && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(repoUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isConnected && data && (
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <span className="w-2 h-2 rounded-full bg-success mr-1.5 animate-pulse" />
                  Connected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Last synced: {data.stats.lastCommit}
                </span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 mt-3 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {isConnected && data && (
          <>
            {/* Repo Info Banner */}
            <Card className="bg-secondary/30 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{data.repo.fullName}</h3>
                    <p className="text-muted-foreground mt-1 line-clamp-2">
                      {data.repo.description || "No description provided"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Star className="h-4 w-4" />
                      <span className="font-medium">{data.repo.stars}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <GitFork className="h-4 w-4" />
                      <span className="font-medium">{data.repo.forks}</span>
                    </div>
                    {data.repo.language && (
                      <Badge variant="secondary">{data.repo.language}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Recent Commits</p>
                      <p className="text-3xl font-bold text-foreground">{data.stats.totalCommits}</p>
                      <p className="text-xs text-muted-foreground mt-1">Last 30 commits</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GitCommit className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Contributors</p>
                      <p className="text-3xl font-bold text-foreground">{data.stats.totalContributors}</p>
                      <p className="text-xs text-muted-foreground mt-1">Active contributors</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Open Issues</p>
                      <p className="text-3xl font-bold text-foreground">{data.repo.openIssues}</p>
                      <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertCircle className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Stars</p>
                      <p className="text-3xl font-bold text-foreground">{data.repo.stars}</p>
                      <p className="text-xs text-muted-foreground mt-1">Repository popularity</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Star className="h-6 w-6 text-info" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Commit Activity Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Commit Activity
                  </CardTitle>
                  <CardDescription>Weekly commit distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {data.commitActivity.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.commitActivity}>
                          <defs>
                            <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="week" className="text-xs fill-muted-foreground" />
                          <YAxis className="text-xs fill-muted-foreground" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              borderColor: "hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="commits"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorCommits)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No commit activity data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Language Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-primary" />
                    Languages
                  </CardTitle>
                  <CardDescription>Code distribution by language</CardDescription>
                </CardHeader>
                <CardContent>
                  {languagesWithColors.length > 0 ? (
                    <>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={languagesWithColors}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {languagesWithColors.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                borderColor: "hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {languagesWithColors.slice(0, 6).map((lang) => (
                          <div key={lang.name} className="flex items-center gap-2 text-sm">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: lang.color }}
                            />
                            <span className="text-muted-foreground truncate">{lang.name}</span>
                            <span className="font-medium text-foreground ml-auto">{lang.value}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      No language data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contributors & Recent Commits */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Top Contributors
                  </CardTitle>
                  <CardDescription>Team members with most contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.contributors.length > 0 ? (
                      data.contributors.map((contributor, i) => (
                        <div
                          key={contributor.name}
                          className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <span className="text-sm font-medium text-muted-foreground w-6">
                            #{i + 1}
                          </span>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={contributor.avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {contributor.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{contributor.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {contributor.commits} contributions
                            </p>
                          </div>
                          <Badge variant="secondary">{contributor.commits}</Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No contributor data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Commits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitCommit className="h-5 w-5 text-primary" />
                    Recent Commits
                  </CardTitle>
                  <CardDescription>Latest changes pushed to the repository</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.recentCommits.length > 0 ? (
                      data.recentCommits.map((commit) => (
                        <div
                          key={commit.sha}
                          className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <GitCommit className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm line-clamp-1">
                              {commit.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="font-mono text-primary">{commit.sha}</span>
                              <span>•</span>
                              <span>{commit.author}</span>
                              <span>•</span>
                              <span>{commit.date}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {commit.branch}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        No commit data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Empty State */}
        {!isConnected && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="py-16">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <GitBranch className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Repository Connected
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Enter a public GitHub repository URL above to view commit history,
                  contributors, and code statistics.
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>Example: https://github.com/facebook/react</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}