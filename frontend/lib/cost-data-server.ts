// ═══════════════════════════════════════════════════════════════════
// cost-data-server.ts - Server-side only data fetcher
// Purpose: Direct file read without API calls - runs on server only
// This module MUST be used only in Server Components
// ═══════════════════════════════════════════════════════════════════

import { promises as fs } from "node:fs"
import { join } from "node:path"

export interface CostMetric {
  repo_name: string
  deployed_env: string
  criticality_tier: string
  monthly_cost_usd: number
  unit_economics: {
    monthly_active_users: number
    cost_per_1k_users: number
  }
  infrastructure?: {
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

export interface CostAnalysis {
  metrics: CostMetric[]
  totalCost: number
  repoCount: number
  avgCostPerRepo: number
  recommendations: Array<{
    type: string
    severity: string
    repo: string
    message: string
  }>
  healthScore: number
  error: string | null
}

export async function readFileAndAnalyze(): Promise<CostAnalysis> {
  let metrics: CostMetric[] = []
  let error: string | null = null

  try {
    const metricsPath = join(process.cwd(), "..", "cost_advisor_module", "repo_cost_metrics.json")
    const fileContent = await fs.readFile(metricsPath, "utf-8")
    metrics = JSON.parse(fileContent) as CostMetric[]
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load cost data"
  }

  if (error || !metrics.length) {
    return {
      metrics: [],
      totalCost: 0,
      repoCount: 0,
      avgCostPerRepo: 0,
      recommendations: [],
      healthScore: 100,
      error: error || "No data available",
    }
  }

  const totalCost = metrics.reduce((sum, m) => sum + m.monthly_cost_usd, 0)
  const repoCount = metrics.length

  const recommendations: Array<{ type: string; severity: string; repo: string; message: string }> = []

  for (const m of metrics) {
    if (m.infrastructure) {
      const avgCpu = m.infrastructure.avg_cpu_percent
      if (avgCpu < 20 && m.monthly_cost_usd > 300) {
        recommendations.push({
          type: "right-size",
          severity: "high",
          repo: m.repo_name,
          message: `Low CPU (${avgCpu}%) - consider downsizing ${m.infrastructure.provisioned_compute}`,
        })
      }
    }
    if (m.storage && m.storage.last_accessed_days_ago > 30) {
      recommendations.push({
        type: "zombie",
        severity: "medium",
        repo: m.repo_name,
        message: `Storage unused ${m.storage.last_accessed_days_ago} days`,
      })
    }
    if (m.unit_economics.cost_per_1k_users > 500 && m.unit_economics.monthly_active_users < 100) {
      recommendations.push({
        type: "inefficient",
        severity: "medium",
        repo: m.repo_name,
        message: `High cost/user $${m.unit_economics.cost_per_1k_users.toFixed(2)}/1K`,
      })
    }
  }

  const healthScore = Math.max(0, 100 - recommendations.filter(r => r.severity === "high").length * 20)

  return {
    metrics,
    totalCost,
    repoCount,
    avgCostPerRepo: totalCost / repoCount,
    recommendations,
    healthScore,
    error: null,
  }
}