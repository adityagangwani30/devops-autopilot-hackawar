import crypto from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import {
  knowledgeGraphEdge,
  knowledgeGraphNode,
  repositoryAnalysis,
} from "@/lib/db/schema"
import type { AiCtoPipelineResult } from "@/lib/server/ai-cto"
import type { GitHubRepoSummary } from "@/lib/server/github"
import {
  createEdge,
  createNode,
  deleteUserGraph,
  getGraphForUser,
} from "@/lib/server/neo4j-client"

interface GraphNodeEntry {
  id: string
  label: string
  nodeType: string
  repoFullName: string
  properties: Record<string, unknown>
}

interface GraphEdgeEntry {
  id: string
  sourceNodeId: string
  targetNodeId: string
  edgeType: string
  label: string
  repoFullName: string
  properties: Record<string, unknown>
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T) {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "item"
}

function summarizeAnalysis(markdown: string | null | undefined) {
  const plainText = (markdown || "")
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\n+/g, " ")
    .trim()

  if (!plainText) {
    return "Analysis completed."
  }

  return plainText.slice(0, 280)
}

function takeStringArray(value: unknown, limit: number) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, limit)
}

function buildGraphEntries(repo: GitHubRepoSummary, analysis: AiCtoPipelineResult) {
  const repoNodeId = `repo:${repo.fullName}`
  const nowIso = new Date().toISOString()
  const metadata = analysis.data?.metadata ?? {}
  const workflows = analysis.workflows.length > 0
    ? analysis.workflows
    : analysis.data?.workflows ?? []
  const languages = analysis.data?.languages ?? {}
  const structure = analysis.data?.structure ?? {}
  const topLevelDirectories = takeStringArray(structure.top_level_directories, 10)
  const importantFiles = takeStringArray(structure.important_files, 10)

  const nodes: GraphNodeEntry[] = [
    {
      id: repoNodeId,
      label: repo.name,
      nodeType: "Repository",
      repoFullName: repo.fullName,
      properties: {
        userId: "", 
        fullName: repo.fullName,
        description: repo.description,
        defaultBranch: repo.defaultBranch,
        primaryLanguage: repo.primaryLanguage,
        stars: repo.stargazersCount,
        forks: repo.forksCount,
        htmlUrl: repo.htmlUrl,
        analyzedAt: nowIso,
        metadata,
        summary: summarizeAnalysis(analysis.analysis),
      },
    },
  ]

  const edges: GraphEdgeEntry[] = []

  Object.entries(languages).forEach(([language, bytes]) => {
    const languageNodeId = `language:${repo.fullName}:${slugify(language)}`
    nodes.push({
      id: languageNodeId,
      label: language,
      nodeType: "Language",
      repoFullName: repo.fullName,
      properties: {
        userId: "",
        bytes,
      },
    })
    edges.push({
      id: `edge:${repoNodeId}:${languageNodeId}:USES_LANGUAGE`,
      sourceNodeId: repoNodeId,
      targetNodeId: languageNodeId,
      edgeType: "USES_LANGUAGE",
      label: "uses",
      repoFullName: repo.fullName,
      properties: {
        bytes,
      },
    })
  })

  topLevelDirectories.forEach((directory, index) => {
    const directoryNodeId = `directory:${repo.fullName}:${slugify(directory)}`
    nodes.push({
      id: directoryNodeId,
      label: directory,
      nodeType: "Directory",
      repoFullName: repo.fullName,
      properties: {
        userId: "",
        path: directory,
      },
    })
    edges.push({
      id: `edge:${repoNodeId}:${directoryNodeId}:HAS_DIRECTORY`,
      sourceNodeId: repoNodeId,
      targetNodeId: directoryNodeId,
      edgeType: "HAS_DIRECTORY",
      label: "directory",
      repoFullName: repo.fullName,
      properties: {
        index,
      },
    })
  })

  importantFiles.forEach((fileName, index) => {
    const fileNodeId = `file:${repo.fullName}:${slugify(fileName)}`
    nodes.push({
      id: fileNodeId,
      label: fileName,
      nodeType: "File",
      repoFullName: repo.fullName,
      properties: {
        userId: "",
        path: fileName,
      },
    })
    edges.push({
      id: `edge:${repoNodeId}:${fileNodeId}:HAS_FILE`,
      sourceNodeId: repoNodeId,
      targetNodeId: fileNodeId,
      edgeType: "HAS_FILE",
      label: "file",
      repoFullName: repo.fullName,
      properties: {
        index,
      },
    })
  })

  workflows.forEach((workflow, index) => {
    const workflowLabel = workflow.name || workflow.path || `workflow-${index + 1}`
    const workflowNodeId = `workflow:${repo.fullName}:${slugify(workflow.path || workflowLabel)}`
    nodes.push({
      id: workflowNodeId,
      label: workflowLabel,
      nodeType: "Workflow",
      repoFullName: repo.fullName,
      properties: {
        userId: "",
        path: workflow.path,
      },
    })
    edges.push({
      id: `edge:${repoNodeId}:${workflowNodeId}:HAS_WORKFLOW`,
      sourceNodeId: repoNodeId,
      targetNodeId: workflowNodeId,
      edgeType: "HAS_WORKFLOW",
      label: "workflow",
      repoFullName: repo.fullName,
      properties: {
        index,
      },
    })
  })

  analysis.ci_issues.forEach((issue, index) => {
    const title = typeof issue.title === "string"
      ? issue.title
      : typeof issue.issue === "string"
        ? issue.issue
        : `CI issue ${index + 1}`
    const issueNodeId = `ci-issue:${repo.fullName}:${index}`
    nodes.push({
      id: issueNodeId,
      label: title,
      nodeType: "CIIssue",
      repoFullName: repo.fullName,
      properties: {
        userId: "",
        issue,
      },
    })
    edges.push({
      id: `edge:${repoNodeId}:${issueNodeId}:HAS_CI_ISSUE`,
      sourceNodeId: repoNodeId,
      targetNodeId: issueNodeId,
      edgeType: "HAS_CI_ISSUE",
      label: "ci issue",
      repoFullName: repo.fullName,
      properties: {
        index,
      },
    })
  })

  analysis.suggestions.forEach((suggestion, index) => {
    const suggestionNodeId = `suggestion:${repo.fullName}:${index}`
    nodes.push({
      id: suggestionNodeId,
      label: `Suggestion ${index + 1}`,
      nodeType: "Suggestion",
      repoFullName: repo.fullName,
      properties: {
        userId: "",
        suggestion,
      },
    })
    edges.push({
      id: `edge:${repoNodeId}:${suggestionNodeId}:HAS_SUGGESTION`,
      sourceNodeId: repoNodeId,
      targetNodeId: suggestionNodeId,
      edgeType: "HAS_SUGGESTION",
      label: "suggestion",
      repoFullName: repo.fullName,
      properties: {
        index,
      },
    })
  })

  return { nodes, edges }
}

export async function listStoredAnalysesForUser(userId: string) {
  return db
    .select()
    .from(repositoryAnalysis)
    .where(eq(repositoryAnalysis.userId, userId))
    .orderBy(desc(repositoryAnalysis.updatedAt))
}

export async function saveFailedAnalysis(userId: string, repoFullName: string, error: string) {
  const [ownerLogin, repoName] = repoFullName.split("/")
  const now = new Date()

  await db.delete(repositoryAnalysis).where(eq(repositoryAnalysis.id, `${userId}:${repoFullName}`))
  await db.insert(repositoryAnalysis).values({
    id: `${userId}:${repoFullName}`,
    userId,
    repoFullName,
    repoName: repoName || repoFullName,
    ownerLogin: ownerLogin || "unknown",
    status: "failed",
    lastError: error,
    createdAt: now,
    updatedAt: now,
    analyzedAt: now,
  })
}

export async function saveRepositoryAnalysisAndGraph(
  userId: string,
  repo: GitHubRepoSummary,
  analysis: AiCtoPipelineResult,
) {
  const now = new Date()
  const analysisId = `${userId}:${repo.fullName}`
  const { nodes, edges } = buildGraphEntries(repo, analysis)

  await db.delete(repositoryAnalysis).where(eq(repositoryAnalysis.id, analysisId))
  await db.insert(repositoryAnalysis).values({
    id: analysisId,
    userId,
    repoFullName: repo.fullName,
    repoName: repo.name,
    ownerLogin: repo.ownerLogin,
    htmlUrl: repo.htmlUrl,
    description: repo.description,
    defaultBranch: repo.defaultBranch,
    isPrivate: repo.isPrivate,
    primaryLanguage: repo.primaryLanguage,
    languagesJson: JSON.stringify(analysis.data?.languages ?? {}),
    dependenciesJson: JSON.stringify(analysis.data?.dependencies ?? {}),
    workflowsJson: JSON.stringify(analysis.workflows),
    issuesJson: JSON.stringify(analysis.data?.issues ?? []),
    ciIssuesJson: JSON.stringify(analysis.ci_issues),
    suggestionsJson: JSON.stringify(analysis.suggestions),
    analysisMarkdown: analysis.analysis ?? null,
    summary: summarizeAnalysis(analysis.analysis),
    historyJson: JSON.stringify(analysis.history),
    rawJson: JSON.stringify(analysis),
    status: "completed",
    lastError: analysis.error ?? null,
    analyzedAt: now,
    createdAt: now,
    updatedAt: now,
  })

  // Always persist graph to SQLite (reliable local storage)
  // First, clear existing graph data for this repo
  const existingNodes = await db
    .select({ id: knowledgeGraphNode.id })
    .from(knowledgeGraphNode)
    .where(
      and(
        eq(knowledgeGraphNode.userId, userId),
        eq(knowledgeGraphNode.repoFullName, repo.fullName),
      )
    )
  for (const existing of existingNodes) {
    await db.delete(knowledgeGraphNode).where(eq(knowledgeGraphNode.id, existing.id))
  }

  const existingEdges = await db
    .select({ id: knowledgeGraphEdge.id })
    .from(knowledgeGraphEdge)
    .where(
      and(
        eq(knowledgeGraphEdge.userId, userId),
        eq(knowledgeGraphEdge.repoFullName, repo.fullName),
      )
    )
  for (const existing of existingEdges) {
    await db.delete(knowledgeGraphEdge).where(eq(knowledgeGraphEdge.id, existing.id))
  }

  // Insert new nodes into SQLite
  for (const node of nodes) {
    const nodeProperties = { ...node.properties, userId, repoFullName: node.repoFullName }
    await db.insert(knowledgeGraphNode).values({
      id: node.id,
      userId,
      repoFullName: node.repoFullName,
      label: node.label,
      nodeType: node.nodeType,
      propertiesJson: JSON.stringify(nodeProperties),
      createdAt: now,
      updatedAt: now,
    })
  }

  // Insert new edges into SQLite
  for (const edge of edges) {
    await db.insert(knowledgeGraphEdge).values({
      id: edge.id,
      userId,
      repoFullName: edge.repoFullName,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      edgeType: edge.edgeType,
      label: edge.label,
      propertiesJson: JSON.stringify(edge.properties),
      createdAt: now,
      updatedAt: now,
    })
  }

  // Best-effort: also sync to Neo4j if available
  for (const node of nodes) {
    const nodeProperties = { ...node.properties, userId, repoFullName: node.repoFullName }
    await createNode(node.id, [node.nodeType], nodeProperties)
  }

  for (const edge of edges) {
    await createEdge(edge.sourceNodeId, edge.targetNodeId, edge.edgeType, edge.properties)
  }

  return {
    summary: summarizeAnalysis(analysis.analysis),
    analyzedAt: now.toISOString(),
    suggestionsCount: analysis.suggestions.length,
    ciIssuesCount: analysis.ci_issues.length,
  }
}

export async function rebuildKnowledgeGraphFromStoredAnalyses(userId: string) {
  const analyses = await listStoredAnalysesForUser(userId)

  await deleteUserGraph(userId)
  // Also clear SQLite graph tables
  await db.delete(knowledgeGraphEdge).where(eq(knowledgeGraphEdge.userId, userId))
  await db.delete(knowledgeGraphNode).where(eq(knowledgeGraphNode.userId, userId))

  for (const analysis of analyses) {
    if (!analysis.rawJson || analysis.status !== "completed") {
      continue
    }

    const repo: GitHubRepoSummary = {
      id: crypto.createHash("sha1").update(analysis.repoFullName).digest("hex"),
      fullName: analysis.repoFullName,
      name: analysis.repoName,
      ownerLogin: analysis.ownerLogin,
      ownerAvatarUrl: null,
      description: analysis.description,
      htmlUrl: analysis.htmlUrl || `https://github.com/${analysis.repoFullName}`,
      isPrivate: Boolean(analysis.isPrivate),
      visibility: analysis.isPrivate ? "private" : "public",
      defaultBranch: analysis.defaultBranch || "main",
      primaryLanguage: analysis.primaryLanguage,
      stargazersCount: 0,
      forksCount: 0,
      openIssuesCount: 0,
      updatedAt: analysis.updatedAt?.toISOString?.() || new Date().toISOString(),
    }

    await saveRepositoryAnalysisAndGraph(
      userId,
      repo,
      safeJsonParse<AiCtoPipelineResult>(analysis.rawJson, {
        success: true,
        repo: analysis.repoFullName,
        data: {
          metadata: {},
          issues: [],
          workflows: [],
          languages: {},
        },
        analysis: analysis.analysisMarkdown,
        workflows: safeJsonParse(analysis.workflowsJson, []),
        ci_issues: safeJsonParse(analysis.ciIssuesJson, []),
        suggestions: safeJsonParse(analysis.suggestionsJson, []),
        history: safeJsonParse(analysis.historyJson, []),
        error: analysis.lastError,
      }),
    )
  }
}

function normalizeNodeType(type: string): string {
  const map: Record<string, string> = {
    Repository: "repository",
    Language: "language",
    Directory: "directory",
    File: "file",
    Workflow: "workflow",
    CIIssue: "ci_issue",
    Suggestion: "suggestion",
  }
  return map[type] || type.toLowerCase()
}

export async function getKnowledgeGraphForUser(userId: string) {
  const [neo4jGraph, analyses, sqliteNodes, sqliteEdges] = await Promise.all([
    getGraphForUser(userId),
    listStoredAnalysesForUser(userId),
    db
      .select()
      .from(knowledgeGraphNode)
      .where(eq(knowledgeGraphNode.userId, userId)),
    db
      .select()
      .from(knowledgeGraphEdge)
      .where(eq(knowledgeGraphEdge.userId, userId)),
  ])

  const completedRepos = new Set(
    analyses
      .filter((analysis) => analysis.status === "completed")
      .map((analysis) => analysis.repoFullName)
  )

  let nodes = neo4jGraph.nodes
  let edges = neo4jGraph.edges

  if (nodes.length === 0 && sqliteNodes.length > 0) {
    nodes = sqliteNodes.map((node) => ({
      id: node.id,
      repoFullName: node.repoFullName,
      label: node.label,
      type: normalizeNodeType(node.nodeType),
      properties: safeJsonParse<Record<string, unknown>>(node.propertiesJson, {}),
    }))
    edges = sqliteEdges.map((edge) => ({
      id: edge.id,
      repoFullName: edge.repoFullName,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      type: edge.edgeType,
      label: edge.label || "",
      properties: safeJsonParse<Record<string, unknown>>(edge.propertiesJson, {}),
    }))
  }

  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      repoFullName: (node.properties?.repoFullName as string) || (node as any).repoFullName || "",
      label: node.label,
      type: normalizeNodeType(node.type),
      properties: node.properties,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      repoFullName: (edge as any).repoFullName || "",
      source: edge.source,
      target: edge.target,
      type: edge.type,
      label: edge.label,
      properties: edge.properties,
    })),
    stats: {
      analyzedRepositories: completedRepos.size,
      failedRepositories: analyses.filter((analysis) => analysis.status === "failed").length,
      graphNodes: nodes.length,
      graphEdges: edges.length,
    },
    analyses: analyses.map((analysis) => ({
      repoFullName: analysis.repoFullName,
      repoName: analysis.repoName,
      status: analysis.status,
      summary: analysis.summary,
      analyzedAt: analysis.analyzedAt?.toISOString() ?? null,
      lastError: analysis.lastError,
    })),
  }
}