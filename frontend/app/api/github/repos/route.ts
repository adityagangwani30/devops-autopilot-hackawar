import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { listStoredAnalysesForUser } from "@/lib/server/analysis-store"
import {
  getGitHubAccessTokenForUser,
  listGitHubReposForUser,
} from "@/lib/server/github"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let githubAccessToken: string
    try {
      githubAccessToken = await getGitHubAccessTokenForUser(session.user.id)
    } catch (tokenError) {
      return NextResponse.json({
        repositories: [],
        error: tokenError instanceof Error ? tokenError.message : "GitHub token not available",
      })
    }

    let repositories: Awaited<ReturnType<typeof listGitHubReposForUser>> = []
    try {
      repositories = await listGitHubReposForUser(githubAccessToken)
    } catch (githubError) {
      console.error("GitHub API error:", githubError)
      return NextResponse.json({
        repositories: [],
        error: githubError instanceof Error ? githubError.message : "Failed to fetch GitHub repositories",
      })
    }

    const analyses = await listStoredAnalysesForUser(session.user.id)
    const analysisMap = new Map(
      analyses.map((analysis) => [analysis.repoFullName, analysis]),
    )

    return NextResponse.json({
      repositories: repositories.map((repo) => {
        const analysis = analysisMap.get(repo.fullName)
        return {
          ...repo,
          analysisStatus: analysis?.status ?? "not_analyzed",
          analysisSummary: analysis?.summary ?? null,
          analyzedAt: analysis?.analyzedAt?.toISOString() ?? null,
          lastError: analysis?.lastError ?? null,
        }
      }),
    })
  } catch (error) {
    console.error("Error fetching GitHub repositories:", error)
    return NextResponse.json(
      {
        repositories: [],
        error: error instanceof Error
          ? error.message
          : "Failed to fetch GitHub repositories",
      },
      { status: 500 },
    )
  }
}
