// ═══════════════════════════════════════════════════════════════════
// CostDashboard.tsx - Simple Server Component Wrapper
// Purpose: Render cost metrics without client-side fetch
// ═══════════════════════════════════════════════════════════════════

import { promises as fs } from "node:fs"
import { join } from "node:path"

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getTierColor(tier: string): string {
  switch (tier) {
    case "Tier 1": return "#ef4444"
    case "Tier 2": return "#f59e0b"
    case "Tier 3": return "#22c55e"
    default: return "#64748b"
  }
}

function getEfficiencyColor(costPer1kUsers: number): string {
  if (costPer1kUsers < 100) return "#22c55e"
  if (costPer1kUsers < 500) return "#f59e0b"
  return "#ef4444"
}

function getRecommendations(metrics: CostMetric[]) {
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
  return recommendations
}

export default async function CostDashboard() {
  let metrics: CostMetric[] = []
  let error: string | null = null

  try {
    const metricsPath = join(process.cwd(), "..", "cost_advisor_module", "repo_cost_metrics.json")
    const fileContent = await fs.readFile(metricsPath, "utf-8")
    metrics = JSON.parse(fileContent) as CostMetric[]
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load"
  }

  if (error || !metrics.length) {
    return (
      <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "32px", border: "1px solid #ef444440", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>⚠️</div>
        <h3 style={{ margin: "0 0 12px", color: "#f1f5f9", fontSize: "1.25rem" }}>Unable to Load Cost Data</h3>
        <p style={{ margin: 0, color: "#64748b" }}>{error || "No data available"}</p>
      </div>
    )
  }

  const totalCost = metrics.reduce((sum, m) => sum + m.monthly_cost_usd, 0)
  const recommendations = getRecommendations(metrics)
  const healthScore = Math.max(0, 100 - recommendations.filter(r => r.severity === "high").length * 20)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Cost Advisor</h2>
          <p className="text-sm text-slate-500">Infrastructure cost optimization insights</p>
        </div>
        <span className="rounded bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
          Live Data
        </span>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Monthly Cost</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{formatCurrency(totalCost)}</p>
          <p className="mt-1 text-sm text-slate-500">{metrics.length} repositories</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Potential Savings</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">{formatCurrency(recommendations.filter(r => r.severity !== "low").length * 150)}</p>
          <p className="mt-1 text-sm text-slate-500">From recommendations</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Health Score</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{healthScore}%</p>
          <p className="mt-1 text-sm text-slate-500">{recommendations.filter(r => r.severity === "high").length} critical issues</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cost Drivers */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <h3 className="text-lg font-semibold text-slate-200">Top Cost Drivers</h3>
          <p className="mt-1 text-sm text-slate-500">Highest spending repositories</p>
          
          <div className="mt-6 space-y-3">
            {metrics.sort((a, b) => b.monthly_cost_usd - a.monthly_cost_usd).map((m) => (
              <div key={m.repo_name} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-slate-300">{m.repo_name}</span>
                    <span className={`rounded px-2 py-0.5 text-xs border ${getTierColor(m.criticality_tier)}/20 ${getTierColor(m.criticality_tier)} border-opacity-30`}
                          style={{ backgroundColor: `${getTierColor(m.criticality_tier)}20`, color: getTierColor(m.criticality_tier) }}>
                      {m.criticality_tier}
                    </span>
                  </div>
                  <span className="font-mono text-sm text-slate-400">{formatCurrency(m.monthly_cost_usd)}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" 
                       style={{ width: `${(m.monthly_cost_usd / totalCost) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-200">Advisor Insights</h3>
              <p className="mt-1 text-sm text-slate-500">Actionable recommendations</p>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              {recommendations.length} insights
            </span>
          </div>

          <div className="mt-6 space-y-3 max-h-[320px] overflow-y-auto pr-2">
            {recommendations.length > 0 ? (
              recommendations.map((rec, idx) => (
                <div key={`${rec.repo}-${idx}`} className={`rounded-lg border p-4 ${
                  rec.severity === "high" ? "bg-red-500/10 border-red-500/30" :
                  rec.severity === "medium" ? "bg-amber-500/10 border-amber-500/30" :
                  "bg-emerald-500/10 border-emerald-500/30"
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-lg ${
                      rec.severity === "high" ? "text-red-400" :
                      rec.severity === "medium" ? "text-amber-400" :
                      "text-emerald-400"
                    }`}>
                      {rec.type === "right-size" ? "⚙️" : rec.type === "zombie" ? "🧟" : rec.type === "inefficient" ? "💰" : "✅"}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium uppercase ${
                          rec.severity === "high" ? "text-red-400" :
                          rec.severity === "medium" ? "text-amber-400" :
                          "text-emerald-400"
                        }`}>{rec.severity}</span>
                        <span className="font-mono text-xs text-slate-500">• {rec.repo}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{rec.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recommendations - all systems optimized! ✅</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}