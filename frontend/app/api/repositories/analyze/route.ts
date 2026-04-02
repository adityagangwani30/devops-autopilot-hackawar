import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import {
  saveFailedAnalysis,
  saveRepositoryAnalysisAndGraph,
} from "@/lib/server/analysis-store"
import { analyzeRepositoryWithAiCto } from "@/lib/server/ai-cto"
import { generateCostAdvisorReport } from "@/lib/server/cost-advisor"
import {
  getGitHubAccessTokenForUser,
  listGitHubReposForUser,
} from "@/lib/server/github"

function stripMarkdown(value: string | null | undefined) {
  return (value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\r/g, " ")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function summarizeReadme(readme: string | null | undefined) {
  const cleaned = stripMarkdown(readme)
  if (!cleaned) {
    return null
  }

  const sentences = cleaned
    .match(/[^.!?]+[.!?]+/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? []

  const summary = sentences.length > 0
    ? sentences.slice(0, 3).join(" ")
    : cleaned

  return summary.length > 420
    ? `${summary.slice(0, 417).trimEnd()}...`
    : summary
}

function createReadmePreview(readme: string | null | undefined) {
  const cleaned = stripMarkdown(readme)
  if (!cleaned) {
    return null
  }

  return cleaned.length > 900
    ? `${cleaned.slice(0, 897).trimEnd()}...`
    : cleaned
}

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const repoFullName = typeof body?.repoFullName === "string"
      ? body.repoFullName
      : null

    if (!repoFullName) {
      return NextResponse.json(
        { error: "Repository full name is required" },
        { status: 400 },
      )
    }

    const githubAccessToken = await getGitHubAccessTokenForUser(session.user.id)
    const repositories = await listGitHubReposForUser(githubAccessToken)
    const repository = repositories.find((repo) => repo.fullName === repoFullName)

    if (!repository) {
      return NextResponse.json(
        { error: "Repository not found for the current user" },
        { status: 404 },
      )
    }

    try {
      const analysis = await analyzeRepositoryWithAiCto(
        repository.fullName,
        githubAccessToken,
      )

      const saved = await saveRepositoryAnalysisAndGraph(
        session.user.id,
        repository,
        analysis,
      )

      const workflows = analysis.workflows.length > 0
        ? analysis.workflows
        : analysis.data?.workflows ?? []
      const fetchedIssues = analysis.data?.issues ?? []
      const readmeSource = analysis.data?.readme ?? analysis.data?.readme_truncated ?? null
      let costAdvisor = null

      try {
        costAdvisor = await generateCostAdvisorReport(repository, analysis)
      } catch (costError) {
        costAdvisor = {
          provider: "unavailable",
          model: "unavailable",
          repositories_analyzed: 1,
          advice: "Cost suggestions could not be generated for this repository yet.",
          fallback: true,
          error: costError instanceof Error ? costError.message : "Unknown cost advisor error",
          report: null,
        }
      }

      return NextResponse.json({
        repository: repository.fullName,
        status: "completed",
        ...saved,
        issuesCount: analysis.data?.open_issues_count
          ?? analysis.data?.issues_count
          ?? fetchedIssues.length,
        workflowsCount: workflows.length,
        workflowNames: workflows
          .map((workflow) => workflow.name || workflow.path || "workflow")
          .slice(0, 8),
        issueTitles: fetchedIssues.slice(0, 6).map((issue) => ({
          title: typeof issue.title === "string" ? issue.title : "Untitled issue",
          url: typeof issue.url === "string" ? issue.url : null,
          updatedAt: typeof issue.updated_at === "string" ? issue.updated_at : null,
        })),
        readmeSummary: summarizeReadme(readmeSource),
        readmePreview: createReadmePreview(readmeSource),
        analysis: analysis.analysis,
        suggestions: analysis.suggestions,
        ciIssues: analysis.ci_issues,
        costAdvisor,
      })
    } catch (analysisError) {
      const message = analysisError instanceof Error
        ? analysisError.message
        : "Repository analysis failed"

      await saveFailedAnalysis(session.user.id, repository.fullName, message)

      return NextResponse.json(
        { error: message },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error analyzing repository:", error)
    return NextResponse.json(
      { error: "Failed to analyze repository" },
      { status: 500 },
    )
  }
}
