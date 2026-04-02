import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { account } from "@/lib/db/schema"

export interface GitHubRepoSummary {
  id: string
  fullName: string
  name: string
  ownerLogin: string
  ownerAvatarUrl: string | null
  description: string | null
  htmlUrl: string
  isPrivate: boolean
  visibility: string | null
  defaultBranch: string
  primaryLanguage: string | null
  stargazersCount: number
  forksCount: number
  openIssuesCount: number
  updatedAt: string
}

export interface GitHubPushEventSummary {
  id: string
  repoFullName: string
  branch: string
  pushedAt: string
  commits: number
}

interface GitHubRepoApiResponse {
  id: number
  full_name: string
  name: string
  owner: {
    login: string
    avatar_url?: string | null
  }
  description: string | null
  html_url: string
  private: boolean
  visibility?: string | null
  default_branch: string
  language: string | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  updated_at: string
}

interface GitHubUserEventApiResponse {
  id: string
  type: string
  created_at: string
  repo: {
    name: string
  }
  payload?: {
    ref?: string | null
    size?: number
    commits?: Array<{
      sha?: string
      message?: string
    }>
  }
}

async function fetchGitHubJson<T>(url: string, githubAccessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubAccessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "DevOps-Autopilot",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const details = await response.text()
    
    if (response.status === 404) {
      try {
        const parsed = JSON.parse(details)
        if (parsed.message) {
          throw new Error(`GitHub API error (404): ${parsed.message}. Your token may be expired or revoked. Please sign out and sign in again.`)
        }
      } catch (e) {
        if (e instanceof Error) throw e
      }
    }
    
    if (response.status === 401) {
      throw new Error("GitHub access token is invalid or expired. Please sign out and sign in again to refresh your token.")
    }
    
    throw new Error(details || `GitHub request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function getGitHubAccessTokenForUser(userId: string) {
  const [githubAccount] = await db
    .select({
      accessToken: account.accessToken,
    })
    .from(account)
    .where(
      and(
        eq(account.userId, userId),
        eq(account.providerId, "github"),
      )
    )
    .limit(1)

  if (!githubAccount?.accessToken) {
    throw new Error("GitHub access token not available for the current user")
  }

  return githubAccount.accessToken
}

export async function listGitHubReposForUser(githubAccessToken: string) {
  const repositories: GitHubRepoSummary[] = []

  for (let page = 1; page <= 5; page += 1) {
    const batch = await fetchGitHubJson<GitHubRepoApiResponse[]>(
      `https://api.github.com/user/repos?affiliation=owner&sort=updated&per_page=100&page=${page}`,
      githubAccessToken,
    )

    if (batch.length === 0) {
      break
    }

    repositories.push(
      ...batch.map((repo) => ({
        id: repo.id.toString(),
        fullName: repo.full_name,
        name: repo.name,
        ownerLogin: repo.owner.login,
        ownerAvatarUrl: repo.owner.avatar_url ?? null,
        description: repo.description,
        htmlUrl: repo.html_url,
        isPrivate: repo.private,
        visibility: repo.visibility ?? null,
        defaultBranch: repo.default_branch,
        primaryLanguage: repo.language,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        openIssuesCount: repo.open_issues_count,
        updatedAt: repo.updated_at,
      })),
    )

    if (batch.length < 100) {
      break
    }
  }

  return repositories
}

export async function listRecentPushEventsForUser(githubAccessToken: string) {
  const pushEvents: GitHubPushEventSummary[] = []

  for (let page = 1; page <= 3; page += 1) {
    const batch = await fetchGitHubJson<GitHubUserEventApiResponse[]>(
      `https://api.github.com/user/events?per_page=100&page=${page}`,
      githubAccessToken,
    )

    if (batch.length === 0) {
      break
    }

    pushEvents.push(
      ...batch
        .filter((event) => event.type === "PushEvent" && event.repo?.name)
        .map((event) => ({
          id: event.id,
          repoFullName: event.repo.name,
          branch: event.payload?.ref
            ? event.payload.ref.replace("refs/heads/", "")
            : "unknown",
          pushedAt: event.created_at,
          commits: event.payload?.size
            ?? event.payload?.commits?.length
            ?? 0,
        })),
    )

    if (batch.length < 100) {
      break
    }
  }

  return pushEvents
}
