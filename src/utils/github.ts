export async function fetchGithubRepoData(repoUrl: string) {
    try {
        if (!repoUrl) return null;

        const clean = repoUrl.replace("https://github.com/", "");
        const parts = clean.split("/");
        if (parts.length < 2) return null;
        const [owner, repo] = parts;

        // Fetch commits
        const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/commits`
        );
        if (!res.ok) {
            throw new Error("GitHub API error");
        }
        const commits = await res.json();

        if (!Array.isArray(commits)) return null;

        // Fetch additional info (stars, forks, etc)
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        const repoData = repoRes.ok ? await repoRes.json() : {};

        return {
            // Basic Commit Data (User requested safe fields, snake_case)
            total_commits: commits.length,
            last_commit_message: commits[0]?.commit?.message ?? "",
            last_commit_author: commits[0]?.commit?.author?.name ?? "",
            last_commit_time: commits[0]?.commit?.author?.date ?? "",

            // Repo Metadata (Matched to snake_case for consistency)
            repo_name: repoData.name ?? "",
            description: repoData.description ?? "",
            stars: repoData.stargazers_count ?? 0,
            forks: repoData.forks_count ?? 0,
            open_issues: repoData.open_issues_count ?? 0,
            language: repoData.language ?? "N/A",
            last_updated: repoData.updated_at ? new Date(repoData.updated_at).toLocaleDateString() : "",

            // Safe defaults for others
            total_contributors: 0,
            total_branches: 0,
        };

    } catch (err) {
        console.error("GitHub fetch failed", err);
        return null;
    }
}
