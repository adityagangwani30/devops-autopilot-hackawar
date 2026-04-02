import { randomUUID } from "node:crypto"
import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"
import type { AiCtoPipelineResult } from "@/lib/server/ai-cto"
import type { GitHubRepoSummary } from "@/lib/server/github"

const execFileAsync = promisify(execFile)

export interface RepoCostMetric {
  repo_name: string
  deployed_env: string
  criticality_tier: string
  monthly_cost_usd: number
  unit_economics: {
    monthly_active_users: number
    cost_per_1k_users: number
  }
  infrastructure: {
    provider: string
    provisioned_compute: string
    avg_cpu_percent: number
    peak_cpu_percent: number
  }
  database?: {
    type: string
    allocated_storage_gb: number
    avg_read_iops: number
  }
  storage?: {
    allocated_gb: number
    used_gb: number
    last_accessed_days_ago: number
  }
}

export interface CostAdvisorResult {
  provider: string
  model: string
  repositories_analyzed: number
  advice: string
  fallback?: boolean
  error?: string | null
  report: RepoCostMetric
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

function buildKeywordText(repo: GitHubRepoSummary, analysis: AiCtoPipelineResult) {
  const metadata = analysis.data?.metadata ?? {}
  const structure = analysis.data?.structure ?? {}
  return [
    repo.fullName,
    repo.description,
    analysis.analysis,
    analysis.data?.readme,
    analysis.data?.readme_truncated,
    JSON.stringify(metadata),
    JSON.stringify(structure.top_level_directories ?? []),
    JSON.stringify(structure.important_files ?? []),
    JSON.stringify(analysis.workflows),
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .join(" ")
    .toLowerCase()
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value))
}

function inferEnvironment(repo: GitHubRepoSummary, text: string) {
  if (includesAny(text, ["staging", "sandbox", "demo", "dev ", "development", "qa ", "internal"])) {
    return "Staging"
  }

  if (repo.isPrivate && includesAny(text, ["dashboard", "backoffice", "ops", "admin", "analytics"])) {
    return "Staging"
  }

  return "Production"
}

function inferCriticality(environment: string, text: string) {
  if (environment === "Production" && includesAny(text, ["payments", "auth", "gateway", "billing", "platform", "core api", "public api"])) {
    return "Tier 1"
  }

  if (includesAny(text, ["internal", "admin", "analytics", "dashboard", "reporting", "backoffice"])) {
    return "Tier 3"
  }

  return environment === "Production" ? "Tier 2" : "Tier 3"
}

function inferDatabaseType(text: string) {
  if (includesAny(text, ["postgres", "postgresql", "prisma"])) {
    return "PostgreSQL"
  }
  if (includesAny(text, ["mysql", "mariadb"])) {
    return "MySQL"
  }
  if (includesAny(text, ["mongodb", "mongo"])) {
    return "MongoDB"
  }
  if (includesAny(text, ["redis"])) {
    return "Redis"
  }
  return null
}

function daysSince(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

export function buildRepoCostMetric(repo: GitHubRepoSummary, analysis: AiCtoPipelineResult): RepoCostMetric {
  const text = buildKeywordText(repo, analysis)
  const environment = inferEnvironment(repo, text)
  const criticality = inferCriticality(environment, text)
  const workflowCount = analysis.workflows.length > 0
    ? analysis.workflows.length
    : analysis.data?.workflows?.length ?? 0
  const issueCount = analysis.data?.open_issues_count ?? analysis.data?.issues_count ?? repo.openIssuesCount
  const languageCount = Object.keys(analysis.data?.languages ?? {}).length
  const databaseType = inferDatabaseType(text)
  const storageHeavy = includesAny(text, ["storage", "s3", "upload", "media", "files", "blob", "artifact"])
  const computeHeavy = includesAny(text, ["worker", "queue", "stream", "video", "image", "media", "ml", "ai", "processing"])

  const monthlyCostBase = environment === "Production" ? 220 : 95
  const monthlyCost = Math.round(
    monthlyCostBase
    + (criticality === "Tier 1" ? 180 : criticality === "Tier 2" ? 80 : 25)
    + workflowCount * 14
    + issueCount * 6
    + languageCount * 10
    + (databaseType ? 95 : 0)
    + (storageHeavy ? 35 : 0)
    + (computeHeavy ? 60 : 0),
  )

  let monthlyActiveUsers = environment === "Production" ? 4500 : 300
  monthlyActiveUsers += repo.stargazersCount * 20
  monthlyActiveUsers += issueCount * 10
  if (criticality === "Tier 1") {
    monthlyActiveUsers += 6500
  }
  if (criticality === "Tier 3") {
    monthlyActiveUsers = Math.max(40, Math.round(monthlyActiveUsers / 6))
  }

  let avgCpu = environment === "Production" ? 22 : 8
  avgCpu += workflowCount * 2
  avgCpu += computeHeavy ? 12 : 0
  avgCpu += databaseType ? 6 : 0
  avgCpu = Math.min(avgCpu, criticality === "Tier 1" ? 52 : 34)

  let peakCpu = Math.min(95, avgCpu + (criticality === "Tier 1" ? 42 : 24))
  if (criticality === "Tier 1" && peakCpu < 82) {
    peakCpu = 82
  }

  const provisionedCompute = criticality === "Tier 1"
    ? computeHeavy
      ? "EC2 c6i.xlarge"
      : "ECS Fargate 2 vCPU / 4 GB"
    : environment === "Production"
      ? "EC2 t3.large"
      : "EC2 t3.xlarge"

  const metric: RepoCostMetric = {
    repo_name: repo.fullName,
    deployed_env: environment,
    criticality_tier: criticality,
    monthly_cost_usd: monthlyCost,
    unit_economics: {
      monthly_active_users: monthlyActiveUsers,
      cost_per_1k_users: Number(((monthlyCost / Math.max(monthlyActiveUsers, 1)) * 1000).toFixed(2)),
    },
    infrastructure: {
      provider: "AWS",
      provisioned_compute: provisionedCompute,
      avg_cpu_percent: Number(avgCpu.toFixed(1)),
      peak_cpu_percent: Number(peakCpu.toFixed(1)),
    },
  }

  if (databaseType) {
    metric.database = {
      type: databaseType,
      allocated_storage_gb: criticality === "Tier 1" ? 180 : environment === "Production" ? 100 : 40,
      avg_read_iops: criticality === "Tier 1" ? 220 : 70,
    }
  }

  if (storageHeavy || environment !== "Production") {
    const allocated = storageHeavy ? 220 : 80
    metric.storage = {
      allocated_gb: allocated,
      used_gb: Math.round(allocated * (storageHeavy ? 0.58 : 0.42)),
      last_accessed_days_ago: Math.max(2, Math.min(60, daysSince(repo.updatedAt))),
    }
  }

  return metric
}

async function runLocalCostAdvisor(metric: RepoCostMetric) {
  const workspaceRoot = getWorkspaceRoot()
  const pythonExecutable = resolvePythonExecutable()
  const runnerScript = path.resolve(workspaceRoot, "cost_advisor_module", "local_runner.py")
  const payloadFile = path.resolve(tmpdir(), `cost-advisor-${randomUUID()}.json`)

  await writeFile(payloadFile, JSON.stringify({ metrics: [metric] }), "utf8")

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
      throw new Error(stderr.trim() || "Cost advisor local runner did not return output")
    }

    return JSON.parse(stdout) as Omit<CostAdvisorResult, "report">
  } finally {
    await unlink(payloadFile).catch(() => undefined)
  }
}

export async function generateCostAdvisorReport(repo: GitHubRepoSummary, analysis: AiCtoPipelineResult) {
  const metric = buildRepoCostMetric(repo, analysis)
  const serviceUrl = process.env.COST_ADVISOR_URL || "http://127.0.0.1:8000"

  try {
    const response = await fetch(`${serviceUrl}/advice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metrics: [metric],
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      const details = await response.text()
      throw new Error(details || `Cost advisor service returned ${response.status}`)
    }

    const data = await response.json() as Omit<CostAdvisorResult, "report">
    return {
      ...data,
      report: metric,
    } satisfies CostAdvisorResult
  } catch {
    const data = await runLocalCostAdvisor(metric)
    return {
      ...data,
      report: metric,
    } satisfies CostAdvisorResult
  }
}
