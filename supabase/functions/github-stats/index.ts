import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Support both GET with query param and POST with JSON body
    let repoInput = ''

    if (req.method === 'GET') {
      const url = new URL(req.url)
      repoInput = url.searchParams.get('repo') || ''
    } else {
      const body = await req.json()
      repoInput = body.repoUrl || body.repo || ''
    }

    if (!repoInput.trim()) {
      throw new Error('Missing repository URL. Pass ?repo=owner/repo or ?repo=https://github.com/owner/repo')
    }

    // Extract owner and repo name
    let owner: string
    let repo: string

    if (repoInput.includes('github.com')) {
      const parts = repoInput.replace(/\/$/, '').split('github.com/')[1]?.split('/')
      if (!parts || parts.length < 2) throw new Error('Invalid GitHub URL format')
      owner = parts[0]
      repo = parts[1].replace('.git', '')
    } else {
      const parts = repoInput.split('/')
      if (parts.length < 2) throw new Error('Invalid format. Use owner/repo or full GitHub URL')
      owner = parts[0]
      repo = parts[1]
    }

    if (!owner || !repo) {
      throw new Error('Could not parse owner/repo from the provided URL')
    }

    // GitHub API headers
    const githubToken = Deno.env.get('GITHUB_ACCESS_TOKEN')
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'supabase-edge-function',
    }
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`
    }

    // Fetch repo info
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
    if (!repoRes.ok) {
      const errBody = await repoRes.json().catch(() => ({}))
      throw new Error(errBody.message || `GitHub API error: ${repoRes.status} ${repoRes.statusText}`)
    }
    const repoData = await repoRes.json()

    // Fetch contributors (top 10)
    const contributorsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`, { headers })
    const contributorsData = contributorsRes.ok ? await contributorsRes.json() : []

    // Fetch recent commits (last 30)
    const commitsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`, { headers })
    const commitsData = commitsRes.ok ? await commitsRes.json() : []

    // Fetch languages
    const languagesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers })
    const languagesData = languagesRes.ok ? await languagesRes.json() : {}

    // Fetch branches count
    const branchesRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`, { headers })
    const branchesData = branchesRes.ok ? await branchesRes.json() : []

    // Process languages into percentages
    const totalBytes = Object.values(languagesData as Record<string, number>).reduce((sum: number, val: number) => sum + val, 0)
    const languages = Object.entries(languagesData as Record<string, number>).map(([name, bytes]) => ({
      name,
      value: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
    }))

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
    }))

    // Process contributors
    const contributors = (Array.isArray(contributorsData) ? contributorsData : []).map((c: any) => ({
      name: c.login || 'Unknown',
      avatar: c.avatar_url || '',
      commits: c.contributions || 0,
      additions: 0,
      deletions: 0,
    }))

    // Build weekly commit activity from recent commits
    const weekMap: Record<string, number> = {}
    for (const c of (Array.isArray(commitsData) ? commitsData : [])) {
      const date = c.commit?.author?.date ? new Date(c.commit.author.date) : null
      if (date) {
        const weekLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        weekMap[weekLabel] = (weekMap[weekLabel] || 0) + 1
      }
    }
    const commitActivity = Object.entries(weekMap)
      .map(([week, commits]) => ({ week, commits }))
      .reverse()

    // Build response matching the frontend's GitHubData interface
    const result = {
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
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})