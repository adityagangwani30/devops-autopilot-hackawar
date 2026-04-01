// ═══════════════════════════════════════════════════════════════════
// CostMetricsCard.tsx - Server Component (Direct File Read)
// Purpose: Read cost metrics directly from file system, no API calls
// Performance: Zero client-side fetches, runs during SSR only
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

function RepoCard({ metric }: { metric: CostMetric }) {
  const tierColor = getTierColor(metric.criticality_tier)
  const efficiencyColor = getEfficiencyColor(metric.unit_economics.cost_per_1k_users)

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      borderRadius: "12px",
      padding: "20px",
      border: "1px solid #2d3748",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#f1f5f9" }}>
          {metric.repo_name}
        </h3>
        <span style={{
          background: `${tierColor}20`,
          color: tierColor,
          padding: "4px 10px",
          borderRadius: "20px",
          fontSize: "0.75rem",
          fontWeight: 600,
          border: `1px solid ${tierColor}40`,
        }}>
          {metric.criticality_tier}
        </span>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <span style={{
          background: "#334155",
          color: "#94a3b8",
          padding: "3px 8px",
          borderRadius: "4px",
          fontSize: "0.7rem",
          textTransform: "uppercase",
        }}>
          {metric.deployed_env}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "4px", textTransform: "uppercase" }}>
            Monthly Cost
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f1f5f9" }}>
            {formatCurrency(metric.monthly_cost_usd)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "4px", textTransform: "uppercase" }}>
            Cost / 1K Users
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: efficiencyColor }}>
            ${metric.unit_economics.cost_per_1k_users.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}

function CostMetricsSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
      {[1, 2].map((i) => (
        <div key={i} style={{ background: "#1a1a2e", borderRadius: "12px", padding: "20px", border: "1px solid #2d3748", height: "200px" }}>
          <div style={{ background: "#2d3748", borderRadius: "4px", height: "20px", width: "60%", marginBottom: "12px" }} />
          <div style={{ background: "#2d3748", borderRadius: "4px", height: "16px", width: "40%", marginBottom: "20px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[1, 2, 3, 4].map((j) => (
              <div key={j} style={{ background: "#2d3748", borderRadius: "4px", height: "40px" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SERVER COMPONENT - DIRECT FILE READ
// ═══════════════════════════════════════════════════════════════════
export default async function CostMetricsCard() {
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
    return (
      <div style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid #ef444440", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⚠️</div>
        <h3 style={{ margin: "0 0 8px", color: "#f1f5f9" }}>Unable to Load Cost Data</h3>
        <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>{error || "No data available"}</p>
      </div>
    )
  }

  const totalCost = metrics.reduce((sum, m) => sum + m.monthly_cost_usd, 0)

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)", borderRadius: "10px", padding: "16px", border: "1px solid #1e3a5f40" }}>
          <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Total Monthly Cost</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9" }}>{formatCurrency(totalCost)}</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)", borderRadius: "10px", padding: "16px", border: "1px solid #1e3a5f40" }}>
          <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Repositories</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9" }}>{metrics.length}</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)", borderRadius: "10px", padding: "16px", border: "1px solid #1e3a5f40" }}>
          <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Avg Cost / Repo</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9" }}>{formatCurrency(totalCost / metrics.length)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {metrics.map((metric) => (
          <RepoCard key={metric.repo_name} metric={metric} />
        ))}
      </div>
    </div>
  )
}