const GITHUB_API_BASE = 'https://api.github.com'
const REPO_OWNER = 'KryptTerminal'
const REPO_NAME = 'KryptChain'

interface GitHubCommit {
  sha: string
  commit: {
    author: {
      name: string
      email: string
      date: string
    }
    message: string
  }
  html_url: string
}

export class GitHubService {
  private lastCommitSha: string | null = null

  async fetchLatestCommits(limit: number = 10): Promise<GitHubCommit[]> {
    try {
      // Try direct GitHub API first
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=${limit}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          }
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Repository not found or is private, trying worker fallback')
          // Try worker fallback
          return this.fetchFromWorker()
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const commits = await response.json()
      return commits
    } catch (error) {
      console.error('Error fetching GitHub commits, trying worker:', error)
      // Fallback to worker API if CORS or other issues
      return this.fetchFromWorker()
    }
  }

  private async fetchFromWorker(): Promise<GitHubCommit[]> {
    try {
      const response = await fetch('https://kryptterminal.com/api/github/commits')
      if (!response.ok) {
        console.error('Worker API error:', response.status)
        return []
      }
      const data = await response.json()
      // Transform worker format to GitHub format
      return data.commits.map((commit: any) => ({
        sha: commit.sha,
        commit: {
          author: {
            name: commit.author,
            email: 'noreply@kryptterminal.com',
            date: commit.date
          },
          message: commit.message
        },
        html_url: commit.url
      }))
    } catch (error) {
      console.error('Worker fallback failed:', error)
      return []
    }
  }

  async checkForNewCommits(): Promise<GitHubCommit | null> {
    try {
      const commits = await this.fetchLatestCommits(1)
      if (commits.length === 0) return null

      const latestCommit = commits[0]
      if (this.lastCommitSha === null) {
        this.lastCommitSha = latestCommit.sha
        return null // Don't return on first check, just set baseline
      }

      if (latestCommit.sha !== this.lastCommitSha) {
        this.lastCommitSha = latestCommit.sha
        return latestCommit
      }

      return null
    } catch (error) {
      console.error('Error checking for new commits:', error)
      return null
    }
  }

  formatCommitForTerminal(commit: GitHubCommit) {
    const lines = commit.commit.message.split('\n')
    const title = lines[0]
    const description = lines.slice(1).join('\n').trim()

    return {
      id: `github-${commit.sha}`,
      timestamp: new Date(commit.commit.author.date),
      type: 'github' as const,
      message: `🔄 GitHub Commit: ${title}`,
      details: {
        sha: commit.sha.substring(0, 7),
        author: commit.commit.author.name,
        description: description || undefined,
        url: commit.html_url,
        fullMessage: commit.commit.message
      }
    }
  }
}

export const githubService = new GitHubService()