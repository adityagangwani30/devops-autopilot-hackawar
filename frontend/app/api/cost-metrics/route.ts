import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import { join } from "node:path"
import { getCached, setCache } from "@/lib/cache"

const CACHE_KEY = "repo-cost-metrics"

interface CostMetric {
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

interface CostMetricsResponse {
  data: CostMetric[]
  generated_at: string
  cached: boolean
  source: string
}

function processSummary(metrics: CostMetric[]) {
  if (!metrics || metrics.length === 0) {
    return {
      total_monthly_cost_usd: 0,
      repository_count: 0,
      average_cost_per_repo: 0,
      top_cost_drivers: [],
      recommendations: [],
      generated_at: new Date().toISOString(),
      cache_ttl_seconds: 60,
    }
  }

  const totalCost = metrics.reduce((sum, m) => sum + m.monthly_cost_usd, 0)
  const sortedByCost = [...metrics].sort((a, b) => b.monthly_cost_usd - a.monthly_cost_usd)

  const topDrivers = sortedByCost.slice(0, 3).map((m) => ({
    repo_name: m.repo_name,
    monthly_cost_usd: m.monthly_cost_usd,
    criticality_tier: m.criticality_tier,
    environment: m.deployed_env,
  }))

  const recommendations: Array<{
    type: string
    severity: "high" | "medium" | "low"
    repo: string
    message: string
  }> = []

  for (const m of metrics) {
    if (m.infrastructure) {
      const avgCpu = m.infrastructure.avg_cpu_percent
      if (avgCpu < 20 && m.monthly_cost_usd > 300) {
        recommendations.push({
          type: "right-size",
          severity: "high",
          repo: m.repo_name,
          message: `Low CPU utilization (${avgCpu}%) - consider downsizing ${m.infrastructure.provisioned_compute}`,
        })
      }
    }

    if (m.storage && m.storage.last_accessed_days_ago > 30) {
      recommendations.push({
        type: "zombie-resource",
        severity: "medium",
        repo: m.repo_name,
        message: `Storage unused for ${m.storage.last_accessed_days_ago} days - consider archiving`,
      })
    }

    if (m.unit_economics.cost_per_1k_users > 500 && m.unit_economics.monthly_active_users < 100) {
      recommendations.push({
        type: "unit-economics",
        severity: "medium",
        repo: m.repo_name,
        message: `High cost per user ($${m.unit_economics.cost_per_1k_users.toFixed(2)}/1K users) - review pricing`,
      })
    }

    if (m.infrastructure && m.criticality_tier === "Tier 1" && m.infrastructure.peak_cpu_percent > 85) {
      recommendations.push({
        type: "performance",
        severity: "high",
        repo: m.repo_name,
        message: `Peak CPU at ${m.infrastructure.peak_cpu_percent}% - risk of throttling during spikes`,
      })
    }
  }

  for (const m of metrics) {
    if (m.infrastructure && m.infrastructure.avg_cpu_percent > 40 && m.infrastructure.avg_cpu_percent < 80) {
      recommendations.push({
        type: "optimized",
        severity: "low",
        repo: m.repo_name,
        message: `Good CPU utilization (${m.infrastructure.avg_cpu_percent}%) - compute costs optimized`,
      })
    }
  }

  return {
    total_monthly_cost_usd: totalCost,
    repository_count: metrics.length,
    average_cost_per_repo: totalCost / metrics.length,
    top_cost_drivers: topDrivers,
    recommendations,
    generated_at: new Date().toISOString(),
    cache_ttl_seconds: 60,
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const cached = getCached<CostMetricsResponse>(CACHE_KEY)
    if (cached) {
      const summary = processSummary(cached.data)
      return NextResponse.json({
        ...summary,
        cached: true,
        source: "repo_cost_metrics.json",
      })
    }

    const metricsPath = join(
      process.cwd(),
      "..",
      "cost_advisor_module",
      "repo_cost_metrics.json"
    )

    const fileContent = await fs.readFile(metricsPath, "utf-8")
    const parsedData = JSON.parse(fileContent) as CostMetric[]

    const response: CostMetricsResponse = {
      data: parsedData,
      generated_at: new Date().toISOString(),
      cached: false,
      source: "repo_cost_metrics.json",
    }

    setCache(CACHE_KEY, response)

    const summary = processSummary(parsedData)
    return NextResponse.json({
      ...summary,
      cached: false,
      source: "repo_cost_metrics.json",
    })
  } catch (error) {
    console.error("[Cost Metrics API] Error loading data:", error)

    return NextResponse.json(
      {
        total_monthly_cost_usd: 0,
        repository_count: 0,
        average_cost_per_repo: 0,
        top_cost_drivers: [],
        recommendations: [],
        generated_at: new Date().toISOString(),
        cache_ttl_seconds: 60,
        cached: false,
        source: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}