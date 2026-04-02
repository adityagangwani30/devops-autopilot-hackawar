"use client"

import Link from "next/link"
import { useSession } from "@/lib/use-session"
import { ProcessedKnowledgeGraph } from "@/components/dashboard/ProcessedKnowledgeGraph"
import type { DashboardInsights, KnowledgeGraphResponse } from "@/lib/dashboard-types"
import { useDashboardInsights, useKnowledgeGraph } from "@/lib/dashboard-queries"

interface MetricCard {
  label: string
  value: number
  sub: string
  color: string
}

const quickActions = [
  { label: "Repositories", desc: "Analyze repositories and inspect findings", href: "/dashboard/repositories" },
  { label: "Knowledge Graph", desc: "Build and inspect the local graph", href: "/dashboard/knowledge-graph" },
  { label: "Analytics", desc: "Review graph and repository metrics", href: "/dashboard/analytics" },
  { label: "AI Assistant", desc: "Ask questions grounded in the graph", href: "/dashboard/chatbot" },
]

export default function OverviewPage() {
  const { session } = useSession()
  const { data: insights, isLoading: insightsLoading, error: insightsError } = useDashboardInsights()
  const { data: graph, isLoading: graphLoading, error: graphError } = useKnowledgeGraph()
  
  const loading = insightsLoading || graphLoading
  const error = insightsError || graphError

  const metrics: MetricCard[] = insights ? [
    { label: "Repositories", value: insights.summary.totalRepositories, sub: `${insights.summary.analyzedRepositories} analyzed`, color: "teal" },
    { label: "Weekly Pushes", value: insights.summary.weeklyPushes, sub: `${insights.summary.weeklyCommits} commits`, color: "green" },
    { label: "Graph Nodes", value: insights.summary.graphNodes, sub: `${insights.summary.graphEdges} edges`, color: "cyan" },
    { label: "Open Issues", value: insights.summary.totalOpenIssues, sub: `${insights.summary.totalCiFindings} CI findings`, color: "purple" },
  ] : []
  const loadingMetrics: MetricCard[] = Array.from({ length: 4 }, (_, index) => ({
    label: `loading-${index}`,
    value: 0,
    sub: "",
    color: "teal",
  }))

  const maxPushes = Math.max(...(insights?.weeklyPushFrequency.map((item) => item.pushes) || [1]), 1)
  const maxGraphCount = Math.max(...(insights?.graphComposition.map((item) => item.count) || [1]), 1)

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Overview</h2>
          <p>Welcome back, {session?.user?.name || "User"} - here is the live state of your repositories, GitHub pushes, and processed knowledge graph.</p>
        </div>
        <div className="topbar-right">
          <button className="topbar-btn" onClick={() => {
            // Trigger refetch
            window.location.reload()
          }}>
            Refresh
          </button>
        </div>
      </div>

      <div className="dash-content">
        {error ? (
          <div className="dash-card" style={{ padding: "16px 22px", background: "rgba(248,113,113,.08)", borderColor: "rgba(248,113,113,.2)" }}>
            <p style={{ color: "var(--red)", fontSize: ".82rem" }}>{error}</p>
          </div>
        ) : null}

        <div className="metrics-row">
          {(loading ? loadingMetrics : metrics).map((metric, index) => (
            <div key={loading ? index : metric.label} className={`dash-card metric-card ${loading ? "shimmer" : metric.color} dash-animate-in dash-delay-${index + 1}`}>
              <div className="dash-card-body">
                {loading ? null : (
                  <>
                    <p className="dash-card-title">{metric.label}</p>
                    <p className="metric-value" style={{ color: "var(--accent)" }}>{metric.value}</p>
                    <div className="metric-sub">{metric.sub}</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="middle-row">
          <div className="dash-card dash-animate-in dash-delay-5">
            <div className="dash-card-header">
              <p className="dash-card-title">Recent Push Activity</p>
              <span className="dash-card-badge">GitHub</span>
            </div>
            <div className="dash-card-body" style={{ padding: 0 }}>
              {loading ? (
                <div className="dash-card shimmer" style={{ minHeight: "24px" }} />
              ) : !insights || insights.recentPushes.length === 0 ? (
                <div style={{ padding: "28px", color: "var(--text-muted)", textAlign: "center" }}>
                  No recent push events were found for the connected repositories.
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Repository</th>
                        <th>Branch</th>
                        <th>Commits</th>
                        <th>Pushed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.recentPushes.map((push) => (
                        <tr key={push.id}>
                          <td>{push.repoFullName}</td>
                          <td>{push.branch}</td>
                          <td>{push.commits}</td>
                          <td>{new Date(push.pushedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="dash-card dash-animate-in dash-delay-6">
            <div className="dash-card-header">
              <p className="dash-card-title">Processed Graph Snapshot</p>
              <span className="dash-card-badge">Current data</span>
            </div>
            <div className="dash-card-body">
              {loading ? (
                <div className="dash-card shimmer" style={{ minHeight: "220px" }} />
              ) : (
                <div style={{ display: "grid", gap: "18px" }}>
                  <ProcessedKnowledgeGraph
                    nodes={graph?.nodes || []}
                    edges={graph?.edges || []}
                    compact
                  />

                  <div>
                    <p style={{ fontSize: ".68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                      Knowledge Graph Composition
                    </p>
                    <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
                      {(insights?.graphComposition || []).slice(0, 5).map((item) => (
                        <div key={item.type} className="freq-item">
                          <span className="freq-label">{item.type.replace("_", " ")}</span>
                          <div className="freq-bar-track">
                            <div className="freq-bar-fill" style={{ width: `${(item.count / maxGraphCount) * 100}%` }} />
                          </div>
                          <span className="freq-value">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: ".68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>
                      Languages in Scope
                    </p>
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {(insights?.languageDistribution || []).length > 0 ? (
                        insights?.languageDistribution.map((item) => (
                          <span key={item.language} className="dash-card-badge">
                            {item.language} ({item.count})
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: ".74rem" }}>
                          No primary language data available yet.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bottom-row">
          <div className="dash-card dash-animate-in dash-delay-7">
            <div className="dash-card-header">
              <p className="dash-card-title">Weekly Push Frequency</p>
              <span className="dash-card-badge">From GitHub push events</span>
            </div>
            <div className="dash-card-body">
              {loading ? (
                <div className="dash-card shimmer" style={{ minHeight: "180px" }} />
              ) : (
                <div className="freq-list">
                  {(insights?.weeklyPushFrequency || []).map((day) => (
                    <div key={day.date} className="freq-item">
                      <span className="freq-label">{day.label}</span>
                      <div className="freq-bar-track">
                        <div className="freq-bar-fill" style={{ width: `${(day.pushes / maxPushes) * 100}%` }} />
                      </div>
                      <span className="freq-value">{day.pushes} pushes / {day.commits} commits</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dash-card dash-animate-in dash-delay-7">
            <div className="dash-card-header">
              <p className="dash-card-title">Quick Actions</p>
            </div>
            <div className="dash-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    style={{
                      display: "block",
                      padding: "16px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      textAlign: "left",
                      textDecoration: "none",
                    }}
                  >
                    <p style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--text-primary)" }}>{action.label}</p>
                    <p style={{ fontSize: ".65rem", color: "var(--text-muted)", marginTop: "4px" }}>{action.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          <div className="dash-card dash-animate-in dash-delay-8">
            <div className="dash-card-header">
              <p className="dash-card-title">Security Vulnerabilities</p>
              <span className="dash-card-badge">From analyzed dependencies</span>
            </div>
            <div className="dash-card-body">
              {loading ? (
                <div className="dash-card shimmer" style={{ minHeight: "200px" }} />
              ) : insights?.error ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                  {insights.error}
                </div>
              ) : insights?.cves && insights.cves.length > 0 ? (
                <div className="cve-list">
                  {insights.cves.map((cve) => (
                    <div key={cve.id} className={`cve-item severity-${cve.severity.toLowerCase()}`}>
                      <div className="cve-header">
                        <span className={`cve-id ${getCveSeverityClass(cve.severity)}`}>
                          {cve.id}
                        </span>
                        <span className="cve-package">{cve.package}</span>
                        <span className="cve-version">{cve.version}</span>
                      </div>
                      <div className="cve-description">
                        {cve.description}
                      </div>
                      <div className="cve-actions">
                        <a href={cve.link} target="_blank" rel="noopener noreferrer" className="cve-link">
                          View CVE Details →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                  No known vulnerabilities found in analyzed dependencies.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function getCveSeverityClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'cve-critical'
    case 'high':
      return 'cve-high'
    case 'medium':
      return 'cve-medium'
    case 'low':
      return 'cve-low'
    default:
      return 'cve-info'
  }
}