import { randomUUID } from "node:crypto"
import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

export interface AiCtoWorkflow {
  name: string
  path: string
  content?: string
}

export interface AiCtoIssue {
  [key: string]: unknown
}

export interface AiCtoPipelineResult {
  success: boolean
  repo: string
  data: {
    metadata?: Record<string, unknown>
    readme?: string | null
    readme_truncated?: string | null
    issues?: Array<Record<string, unknown>>
    issues_count?: number
    open_issues_count?: number
    workflows?: AiCtoWorkflow[]
    languages?: Record<string, number>
    languages_total?: number
    dependencies?: Record<string, string>
    structure?: {
      default_branch?: string
      root_entries?: Array<{
        name?: string
        path?: string
        type?: string
        size?: number
      }>
      top_level_directories?: string[]
      important_files?: string[]
      sample_paths?: string[]
      truncated?: boolean
    }
  }
  analysis?: string | null
  workflows: AiCtoWorkflow[]
  ci_issues: AiCtoIssue[]
  suggestions: string[]
  history: Array<Record<string, unknown>>
  error?: string | null
}

export interface AiCtoChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface AiCtoKnowledgeGraphContext {
  nodes: Array<{
    id: string
    repoFullName: string
    label: string
    type: string
    properties: Record<string, unknown>
  }>
  edges: Array<{
    id: string
    repoFullName: string
    source: string
    target: string
    type: string
    label: string | null
    properties: Record<string, unknown>
  }>
  stats: {
    analyzedRepositories: number
    failedRepositories: number
    graphNodes: number
    graphEdges: number
  }
  analyses: Array<{
    repoFullName: string
    repoName: string
    status: string
    summary: string | null
    analyzedAt: string | null
    lastError: string | null
  }>
}

export interface AiCtoChatToolResult {
  question: string
  summary: string
  stats: {
    analyzedRepositories: number
    failedRepositories: number
    graphNodes: number
    graphEdges: number
  }
  repositories: Array<{
    repoFullName: string
    repoName: string
    status: string
    summary: string
    analyzedAt: string
    lastError: string
    score: number
  }>
  matchingNodes: Array<{
    label: string
    type: string
    repoFullName: string
    score: number
  }>
  ciIssues: Array<{
    repoFullName: string
    summary: string
    score: number
  }>
  suggestions: Array<{
    repoFullName: string
    summary: string
    score: number
  }>
  topLanguages: Array<{
    language: string
    bytes: number
  }>
  recommendedActions: string[]
}

export interface AiCtoChatResult {
  message: string
  tool_result?: AiCtoChatToolResult | null
  used_tool?: boolean
  fallback?: boolean
}

function getWorkspaceRoot() {
  return path.resolve(process.cwd(), "..")
}

function resolvePythonExecutable() {
  const workspaceRoot = getWorkspaceRoot()
  const candidates = [
    process.env.PYTHON_PATH,
    path.resolve(workspaceRoot, ".venv", "Scripts", "python.exe"),
    path.resolve(workspaceRoot, ".venv", "bin", "python"),
  ].filter((value): value is string => Boolean(value))

  const existingCandidate = candidates.find((candidate) => existsSync(candidate))
  if (existingCandidate) {
    return existingCandidate
  }

  return process.env.PYTHON || "python"
}

async function runLocalAiCtoAnalysis(repo: string, githubToken: string) {
  const workspaceRoot = getWorkspaceRoot()
  const pythonExecutable = resolvePythonExecutable()
  const runnerScript = path.resolve(workspaceRoot, "ai_cto", "local_runner.py")

  const args = [runnerScript, "--repo", repo]
  if (githubToken) {
    args.push("--github-token", githubToken)
  }

  const { stdout, stderr } = await execFileAsync(pythonExecutable, args, {
    cwd: workspaceRoot,
    maxBuffer: 20 * 1024 * 1024,
  })

  if (!stdout.trim()) {
    throw new Error(stderr.trim() || "AI CTO local runner did not return output")
  }

  const parsed = JSON.parse(stdout) as AiCtoPipelineResult
  if (!parsed.success && parsed.error) {
    throw new Error(parsed.error)
  }

  return parsed
}

async function runLocalAiCtoChat(
  messages: AiCtoChatMessage[],
  knowledgeGraph: AiCtoKnowledgeGraphContext,
  system?: string,
) {
  const workspaceRoot = getWorkspaceRoot()
  const pythonExecutable = resolvePythonExecutable()
  const runnerScript = path.resolve(workspaceRoot, "ai_cto", "chat_runner.py")
  const payloadFile = path.resolve(tmpdir(), `ai-cto-chat-${randomUUID()}.json`)

  await writeFile(payloadFile, JSON.stringify({
    messages,
    system,
    temperature: 0.35,
    max_tokens: 1800,
    knowledge_graph: knowledgeGraph,
    use_knowledge_graph_tool: true,
  }), "utf8")

  try {
    const { stdout, stderr } = await execFileAsync(
      pythonExecutable,
      [runnerScript, "--payload-file", payloadFile],
      {
        cwd: workspaceRoot,
        maxBuffer: 20 * 1024 * 1024,
      },
    )

    if (!stdout.trim()) {
      throw new Error(stderr.trim() || "AI CTO local chat runner did not return output")
    }

    return JSON.parse(stdout) as AiCtoChatResult
  } finally {
    await unlink(payloadFile).catch(() => undefined)
  }
}

export async function analyzeRepositoryWithAiCto(repo: string, githubToken: string) {
  const serviceUrl = process.env.AI_CTO_URL || "http://127.0.0.1:8081"

  try {
    const response = await fetch(`${serviceUrl}/analyze-pipeline`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repo,
        github_token: githubToken,
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(details || `AI CTO service returned ${response.status}`)
    }

    return await response.json() as AiCtoPipelineResult
  } catch {
    return runLocalAiCtoAnalysis(repo, githubToken)
  }
}

export async function chatWithAiCto(
  messages: AiCtoChatMessage[],
  knowledgeGraph: AiCtoKnowledgeGraphContext,
  system?: string,
) {
  const serviceUrl = process.env.AI_CTO_URL || "http://127.0.0.1:8081"

  try {
    const response = await fetch(`${serviceUrl}/chat/knowledge-graph`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        system,
        temperature: 0.35,
        max_tokens: 1800,
        knowledge_graph: knowledgeGraph,
        use_knowledge_graph_tool: true,
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(details || `AI CTO chat service returned ${response.status}`)
    }

    return await response.json() as AiCtoChatResult
  } catch {
    return runLocalAiCtoChat(messages, knowledgeGraph, system)
  }
}
