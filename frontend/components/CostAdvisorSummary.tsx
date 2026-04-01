// ═══════════════════════════════════════════════════════════════════
// CostAdvisorSummary.tsx - Server Component (RSC)
// Purpose: Professional DevOps-style dashboard for cost insights
// Performance: Server-side rendering, no client-side JS for data fetching
// Design: Dark theme, Datadog/AWS Cost Explorer aesthetic
// ═══════════════════════════════════════════════════════════════════

import { Suspense } from "react"

// ═══════════════════════════════════════════════════════════════════
// Type Definitions (matching API response)
// ═══════════════════════════════════════════════════════════════════
interface CostDriver {
  repo_name: string
  monthly_cost_usd: number
  criticality_tier: string
  environment: string
}

interface Recommendation {
  type: string
  severity: "high" | "medium" | "low"
  repo: string
  message: string
}

interface CostSummary {
  total_monthly_cost_usd: number
  repository_count: number
  average_cost_per_repo: number
  top_cost_drivers: CostDriver[]
  recommendations: Recommendation[]
  generated_at: string
  cache_ttl_seconds: number
  cached: boolean
  source: string
  error?: string
}

// ═══════════════════════════════════════════════════════════════════
// Server-Side Data Fetcher
// Runs on server during SSR - no client-side fetching needed
// ═══════════════════════════════════════════════════════════════════
async function fetchCostSummary(): Promise<CostSummary> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  
  const response = await fetch(`${baseUrl}/api/cost-metrics`, {
    next: { revalidate: 60 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch cost summary: ${response.statusText}`)
  }

  return response.json()
}

// ═══════════════════════════════════════════════════════════════════
// Helper: Format Currency
// ═══════════════════════════════════════════════════════════════════
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ═══════════════════════════════════════════════════════════════════
// Helper: Get severity color
// ═══════════════════════════════════════════════════════════════════
function getSeverityColor(severity: string): {
  bg: string
  border: string
  text: string
  icon: string
} {
  switch (severity) {
    case "high":
      return {
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-400",
        icon: "●",
      }
    case "medium":
      return {
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        icon: "●",
      }
    case "low":
      return {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        icon: "●",
      }
    default:
      return {
        bg: "bg-slate-500/10",
        border: "border-slate-500/30",
        text: "text-slate-400",
        icon: "●",
      }
  }
}

// ═══════════════════════════════════════════════════════════════════
// Helper: Get tier badge style
// ═══════════════════════════════════════════════════════════════════
function getTierBadge(tier: string): string {
  switch (tier) {
    case "Tier 1":
      return "bg-red-500/20 text-red-400 border-red-500/30"
    case "Tier 2":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30"
    case "Tier 3":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30"
  }
}

// ═══════════════════════════════════════════════════════════════════
// Component: Metric Card
// High-level summary cards (Total Spend, Savings, Health)
// ═══════════════════════════════════════════════════════════════════
function MetricCard({
  label,
  value,
  subValue,
  trend,
  icon,
  accentColor,
}: {
  label: string
  value: string
  subValue?: string
  trend?: "up" | "down" | "neutral"
  icon: string
  accentColor: string
}) {
  const trendColors = {
    up: "text-red-400",
    down: "text-emerald-400",
    neutral: "text-slate-400",
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 h-1 w-full ${accentColor}`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
          {subValue && (
            <p className={`mt-1 text-sm ${trend ? trendColors[trend] : "text-slate-500"}`}>
              {subValue}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2 ${accentColor.replace("bg-", "bg-").replace("/50", "/20")}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Component: Cost Driver Bar
// Lightweight progress bar visualization (no chart library)
// ═══════════════════════════════════════════════════════════════════
function CostDriverBar({
  driver,
  maxCost,
}: {
  driver: CostDriver
  maxCost: number
}) {
  const percentage = (driver.monthly_cost_usd / maxCost) * 100

  return (
    <div className="group py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-slate-300">{driver.repo_name}</span>
          <span className={`rounded px-2 py-0.5 text-xs border ${getTierBadge(driver.criticality_tier)}`}>
            {driver.criticality_tier}
          </span>
        </div>
        <span className="font-mono text-sm text-slate-400">{formatCurrency(driver.monthly_cost_usd)}</span>
      </div>
      
      {/* Progress bar - pure HTML/Tailwind, no canvas/SVG */}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Component: Insight Card
// Color-coded recommendation cards
// ═══════════════════════════════════════════════════════════════════
function InsightCard({ recommendation }: { recommendation: Recommendation }) {
  const colors = getSeverityColor(recommendation.severity)
  const typeIcons: Record<string, string> = {
    "right-size": "⚙️",
    "zombie-resource": "🧟",
    "unit-economics": "💰",
    "performance": "📈",
    "optimized": "✅",
  }

  return (
    <div className={`rounded-lg border ${colors.bg} ${colors.border} p-4 transition-all duration-200 hover:scale-[1.01]`}>
      <div className="flex items-start gap-3">
        <span className={`text-lg ${colors.text}`}>{typeIcons[recommendation.type] || "📋"}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium uppercase tracking-wider ${colors.text}`}>
              {recommendation.severity}
            </span>
            <span className="font-mono text-xs text-slate-500">• {recommendation.repo}</span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{recommendation.message}</p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Component: Loading Skeleton
// Prevents layout shift during SSR
// ═══════════════════════════════════════════════════════════════════
function CostAdvisorSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
            <div className="mt-4 h-8 w-32 animate-pulse rounded bg-slate-800" />
          </div>
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-slate-800" />
            ))}
          </div>
        </div>
        <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Component: Error State
// Graceful degradation
// ═══════════════════════════════════════════════════════════════════
function CostAdvisorError({ error }: { error: Error }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
      <div className="text-3xl">⚠️</div>
      <h3 className="mt-3 text-lg font-semibold text-slate-200">Unable to Load Cost Data</h3>
      <p className="mt-2 text-sm text-slate-400">{error.message || "Please check your backend service"}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SERVER COMPONENT
// ═══════════════════════════════════════════════════════════════════
export async function CostAdvisorSummary() {
  let data: CostSummary | null = null
  let error: Error | null = null

  try {
    data = await fetchCostSummary()
  } catch (e) {
    error = e instanceof Error ? e : new Error("Unknown error")
  }

  // Error state
  if (error) {
    return <CostAdvisorError error={error} />
  }

  // Calculate derived metrics
  const recommendations = data?.recommendations || []
  const potentialSavings = recommendations
    .filter((r) => r.type === "zombie-resource" || r.type === "right-size")
    .length * 150

  const healthScore = Math.max(
    0,
    100 - (recommendations.filter((r) => r.severity === "high").length || 0) * 20
  )

  const maxCost = Math.max(...(data?.top_cost_drivers?.map((d) => d.monthly_cost_usd) || [1]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Cost Advisor</h2>
          <p className="text-sm text-slate-500">Infrastructure cost optimization insights</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {data?.cached && (
            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Cached
            </span>
          )}
          <span>Updated {data?.generated_at ? new Date(data.generated_at).toLocaleTimeString() : "N/A"}</span>
        </div>
      </div>

      {/* Top Metrics - Three high-level cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="Total Monthly Cost"
          value={formatCurrency(data?.total_monthly_cost_usd || 0)}
          subValue={`${data?.repository_count || 0} repositories`}
          icon="💵"
          accentColor="bg-cyan-500"
        />
        <MetricCard
          label="Potential Savings"
          value={formatCurrency(potentialSavings)}
          subValue="Based on recommendations"
          trend={potentialSavings > 0 ? "down" : "neutral"}
          icon="💡"
          accentColor="bg-amber-500"
        />
        <MetricCard
          label="Health Score"
          value={`${healthScore}%`}
          subValue={`${data?.recommendations.filter((r) => r.severity === "high").length || 0} critical issues`}
          trend={healthScore > 70 ? "neutral" : "down"}
          icon="❤️"
          accentColor="bg-emerald-500"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Top Cost Drivers with progress bars */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-slate-200">Top Cost Drivers</h3>
          <p className="mt-1 text-sm text-slate-500">Highest spending repositories</p>
          
          <div className="mt-6">
            {data?.top_cost_drivers && data.top_cost_drivers.length > 0 ? (
              data.top_cost_drivers.map((driver, idx) => (
                <CostDriverBar key={driver.repo_name} driver={driver} maxCost={maxCost} />
              ))
            ) : (
              <p className="text-sm text-slate-500">No cost data available</p>
            )}
          </div>

          {/* Average cost footer */}
          {data?.average_cost_per_repo && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
              <span className="text-sm text-slate-500">Average per repository</span>
              <span className="font-mono text-sm font-medium text-slate-300">
                {formatCurrency(data.average_cost_per_repo)}
              </span>
            </div>
          )}
        </div>

        {/* Right: Advisor Insights */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-200">Advisor Insights</h3>
              <p className="mt-1 text-sm text-slate-500">Actionable recommendations</p>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              {data?.recommendations.length || 0} insights
            </span>
          </div>

          <div className="mt-6 space-y-3 max-h-[320px] overflow-y-auto pr-2">
            {data?.recommendations && data.recommendations.length > 0 ? (
              data.recommendations
                .sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2 }
                  return order[a.severity] - order[b.severity]
                })
                .map((rec, idx) => (
                  <InsightCard key={`${rec.repo}-${idx}`} recommendation={rec} />
                ))
            ) : (
              <p className="text-sm text-slate-500">No recommendations available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Lazy-loaded wrapper for client-side usage
// Use in pages where SSR is not available
// ═══════════════════════════════════════════════════════════════════
export function CostAdvisorSummarySkeleton() {
  return <CostAdvisorSkeleton />
}