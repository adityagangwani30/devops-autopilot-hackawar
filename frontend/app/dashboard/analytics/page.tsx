"use client"

import { useState } from "react"
import { ProcessedKnowledgeGraph } from "@/components/dashboard/ProcessedKnowledgeGraph"
import type {
  DashboardInsights,
  GraphNode,
  KnowledgeGraphResponse,
} from "@/lib/dashboard-types"
import { useDashboardInsights, useKnowledgeGraph } from "@/lib/dashboard-queries"

interface MetricCard {
  label: string
  value: number
  sub: string
  color: string
}

const visibleGraphNodeTypes = new Set([
  "repository",
  "workflow",
  "language",
  "ci_issue",
  "suggestion",
])

function formatStatus(status: string) {
  return status.replace(/_/g, " ")
}

function getStatusTone(status: string) {
  switch (status) {
    case "completed":
      return "fix"
    case "failed":
      return "alert"
    default:
      return ""
  }
}

export default function AnalyticsPage() {
  const { data: insights, isLoading: insightsLoading, error: insightsError } = useDashboardInsights()
  const { data: graph, isLoading: graphLoading, error: graphError } = useKnowledgeGraph()
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  
  const loading = insightsLoading || graphLoading
  const error = insightsError || graphError

  const selectedNodeDetails = selectedNode
    ? Object.entries(selectedNode.properties || {})
    : []

  const summaryCards: MetricCard[] = insights ? [
    {
      label: "Repositories In Scope",
      value: insights.summary.totalRepositories,
      sub: `${insights.summary.analyzedRepositories} analyzed, ${insights.summary.failedRepositories} failed`,
      color: "teal",
    },
    {
      label: "Weekly Push Frequency",
      value: insights.summary.weeklyPushes,
      sub: `${insights.summary.weeklyCommits} commits from GitHub pushes`,
      color: "green",
    },
    {
      label: "Knowledge Graph Coverage",
      value: insights.summary.graphNodes,
      sub: `${insights.summary.graphEdges} connected edges`,
      color: "cyan",
    },
    {
      label: "Actionable Findings",
      value: insights.summary.totalCiFindings + insights.summary.totalSuggestions,
      sub: `${insights.summary.totalOpenIssues} issues, ${insights.summary.totalSuggestions} suggestions`,
      color: "purple",
    },
  ] : []
  const loadingCards: MetricCard[] = Array.from({ length: 4 }, (_, index) => ({
    label: `loading-${index}`,
    value: 0,
    sub: "",
    color: "teal",
  }))

  const maxPushes = Math.max(...(insights?.weeklyPushFrequency?.map((item: { pushes: number }) => item.pushes) || [1]), 1)
  const maxGraphCount = Math.max(...(insights?.graphComposition?.map((item: { count: number }) => item.count) || [1]), 1)
  const maxRepositoryScore = Math.max(...(insights?.topRepositories?.map((item: { score: number }) => item.score) || [1]), 1)

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Analytics</h2>
          <p>Live repository analysis powered by GitHub activity and the processed local knowledge graph.</p>
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
          <div
            className="dash-card"
            style={{
              padding: "16px 22px",
              background: "rgba(248,113,113,.08)",
              borderColor: "rgba(248,113,113,.2)",
            }}
          >
            <p style={{ color: "var(--red)", fontSize: ".82rem" }}>{error?.message || String(error)}</p>
          </div>
        ) : null}

        <div className="metrics-row">
          {(loading ? loadingCards : summaryCards).map((metric, index) => (
            <div
              key={loading ? index : metric.label}
              className={`dash-card metric-card ${loading ? "shimmer" : metric.color} dash-animate-in dash-delay-${index + 1}`}
            >
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

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(300px, 1fr)", gap: "18px", alignItems: "start" }}>
          <div className="dash-card dash-animate-in dash-delay-5" style={{ overflow: "hidden" }}>
            <div className="dash-card-header">
              <p className="dash-card-title">Processed Repository Graph</p>
              <span className="dash-card-badge">Live graph</span>
            </div>
            <div className="dash-card-body" style={{ paddingTop: "8px" }}>
              {loading ? (
                <div className="dash-card shimmer" style={{ minHeight: "420px" }} />
              ) : (
                <ProcessedKnowledgeGraph
                  nodes={graph?.nodes || []}
                  edges={graph?.edges || []}
                  selectedNodeId={selectedNode?.id || null}
                  onSelectNode={setSelectedNode}
                />
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: "18px" }}>
            <div className="dash-card dash-animate-in dash-delay-6">
              <div className="dash-card-header">
                <p className="dash-card-title">Node Details</p>
              </div>
              <div className="dash-card-body">
                {loading ? (
                  <div className="dash-card shimmer" style={{ minHeight: "180px" }} />
                ) : selectedNode ? (
                  <div style={{ display: "grid", gap: "12px" }}>
                    <div>
                      <p style={{ fontSize: ".9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {selectedNode.label}
                      </p>
                      <p style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {selectedNode.type.replace("_", " ")} in {selectedNode.repoFullName}
                      </p>
                    </div>
                    {selectedNodeDetails.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: ".72rem" }}>
                        No stored properties are available for this node yet.
                      </p>
                    ) : (
                      selectedNodeDetails.slice(0, 6).map(([key, value]) => (
                        <div
                          key={key}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            background: "var(--bg-surface)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <p style={{ fontSize: ".66rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                            {key}
                          </p>
                          <p style={{ fontSize: ".74rem", color: "var(--text-primary)", marginTop: "4px" }}>
                            {typeof value === "string" ? value : JSON.stringify(value)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: ".74rem" }}>
                    Build the knowledge graph and select a node to inspect repository-level details.
                  </p>
                )}
              </div>
            </div>

            <div className="dash-card dash-animate-in dash-delay-7">
              <div className="dash-card-header">
                <p className="dash-card-title">Graph Composition</p>
              </div>
              <div className="dash-card-body">
                {loading ? (
                  <div className="dash-card shimmer" style={{ minHeight: "180px" }} />
                ) : (
                  <div className="freq-list">
                    {(insights?.graphComposition || []).map((item: { type: string; count: number }) => (
                      <div key={item.type} className="freq-item">
                        <span className="freq-label">{item.type.replace("_", " ")}</span>
                        <div className="freq-bar-track">
                          <div className="freq-bar-fill" style={{ width: `${(item.count / maxGraphCount) * 100}%` }} />
                        </div>
                        <span className="freq-value">{item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", alignItems: "start" }}>
            <div className="dash-card dash-animate-in dash-delay-7">
              <div className="dash-card-header">
                <p className="dash-card-title">Weekly Push Frequency</p>
              </div>
              <div className="dash-card-body">
                {loading ? (
                  <div className="dash-card shimmer" style={{ minHeight: "220px" }} />
                ) : (
                  <div className="freq-list">
                    {(insights?.weeklyPushFrequency || []).map((item: { date: string; label: string; pushes: number; commits: number }) => (
                      <div key={item.date} className="freq-item">
                        <span className="freq-label">{item.label}</span>
                        <div className="freq-bar-track">
                          <div className="freq-bar-fill" style={{ width: `${(item.pushes / maxPushes) * 100}%` }} />
                        </div>
                        <span className="freq-value">{item.pushes} pushes / {item.commits} commits</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="dash-card dash-animate-in dash-delay-7">
              <div className="dash-card-header">
                <p className="dash-card-title">Repository Focus</p>
              </div>
              <div className="dash-card-body">
                {loading ? (
                  <div className="dash-card shimmer" style={{ minHeight: "220px" }} />
                ) : (
                  <div className="freq-list">
                    {(insights?.topRepositories || []).map((repository: { repoFullName: string; openIssues: number; score: number; ciFindings: number; suggestions: number }) => (
                      <div key={repository.repoFullName} className="freq-item">
                        <span className="freq-label">{repository.repoFullName}</span>
                        <div className="freq-bar-track">
                          <div className="freq-bar-fill" style={{ width: `${(repository.score / maxRepositoryScore) * 100}%` }} />
                        </div>
                        <span className="freq-value">
                          {repository.openIssues} issues / {repository.ciFindings + repository.suggestions} findings
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dash-card dash-animate-in dash-delay-7">
            <div className="dash-card-header">
              <p className="dash-card-title">Repository Analysis Table</p>
              <span className="dash-card-badge">Current cache</span>
            </div>
            <div className="dash-card-body" style={{ padding: 0 }}>
              {loading ? (
                <div className="dash-card shimmer" style={{ minHeight: "280px" }} />
              ) : !insights || insights.topRepositories.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                  No analyzed repositories are available yet.
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Repository</th>
                        <th>Status</th>
                        <th>Language</th>
                        <th>Issues</th>
                        <th>Workflows</th>
                        <th>CI Findings</th>
                        <th>Suggestions</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.topRepositories.map((repository: { 
                        repoFullName: string; 
                        status: string; 
                        primaryLanguage: string | null; 
                        workflows: number; 
                        ciFindings: number; 
                        suggestions: number; 
                        updatedAt: string 
                      }) => (
                        <tr key={repository.repoFullName}>
                          <td>{repository.repoFullName}</td>
                          <td>
                            <span className={`tag ${getStatusTone(repository.status)}`}>
                              {formatStatus(repository.status)}
                            </span>
                          </td>
                          <td>{repository.primaryLanguage || "Unknown"}</td>
                          <td>{repository.workflows}</td>
                          <td>{repository.ciFindings}</td>
                          <td>{repository.suggestions}</td>
                          <td>{new Date(repository.updatedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}