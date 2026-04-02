import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import {
  getKnowledgeGraphForUser,
  listStoredAnalysesForUser,
  rebuildKnowledgeGraphFromStoredAnalyses,
  saveFailedAnalysis,
  saveRepositoryAnalysisAndGraph,
} from "@/lib/server/analysis-store"
import { analyzeRepositoryWithAiCto } from "@/lib/server/ai-cto"
import {
  getGitHubAccessTokenForUser,
  listGitHubReposForUser,
} from "@/lib/server/github"

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const force = Boolean(body?.force)

    const githubAccessToken = await getGitHubAccessTokenForUser(session.user.id)
    const [repositories, analyses] = await Promise.all([
      listGitHubReposForUser(githubAccessToken),
      listStoredAnalysesForUser(session.user.id),
    ])

    const completedAnalyses = new Set(
      analyses
        .filter((analysis) => analysis.status === "completed")
        .map((analysis) => analysis.repoFullName),
    )

    const repositoriesToAnalyze = force
      ? repositories
      : repositories.filter((repo) => !completedAnalyses.has(repo.fullName))

    const failures: Array<{ repo: string; error: string }> = []

    if (repositoriesToAnalyze.length === 0) {
      await rebuildKnowledgeGraphFromStoredAnalyses(session.user.id)
      const graph = await getKnowledgeGraphForUser(session.user.id)
      return NextResponse.json({
        synced: 0,
        failures,
        ...graph,
      })
    }

    let synced = 0
    for (const repository of repositoriesToAnalyze) {
      try {
        const analysis = await analyzeRepositoryWithAiCto(
          repository.fullName,
          githubAccessToken,
        )

        await saveRepositoryAnalysisAndGraph(
          session.user.id,
          repository,
          analysis,
        )

        synced += 1
      } catch (analysisError) {
        const message = analysisError instanceof Error
          ? analysisError.message
          : "Repository analysis failed"

        failures.push({
          repo: repository.fullName,
          error: message,
        })

        await saveFailedAnalysis(session.user.id, repository.fullName, message)
      }
    }

    const graph = await getKnowledgeGraphForUser(session.user.id)
    return NextResponse.json({
      synced,
      failures,
      ...graph,
    })
  } catch (error) {
    console.error("Error syncing knowledge graph:", error)
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Failed to sync knowledge graph",
      },
      { status: 500 },
    )
  }
}
