"use client"

import { useEffect, useState } from "react"

interface GraphNode {
  id: string
  repoFullName: string
  label: string
  type: string
  properties: Record<string, unknown>
}

interface GraphEdge {
  id: string
  repoFullName: string
  source: string
  target: string
  type: string
  label: string | null
  properties: Record<string, unknown>
}

interface AnalysisSummary {
  repoFullName: string
  repoName: string
  status: string
  summary: string | null
  analyzedAt: string | null
  lastError: string | null
}

interface KnowledgeGraphResponse {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: {
    analyzedRepositories: number
    failedRepositories: number
    graphNodes: number
    graphEdges: number
  }
  analyses: AnalysisSummary[]
}

const nodeColors: Record<string, string> = {
  repository: "#2dd4bf",
  directory: "#22c55e",
  file: "#facc15",
  workflow: "#38bdf8",
  language: "#f59e0b",
  ci_issue: "#f97316",
  suggestion: "#a78bfa",
}

export default function KnowledgeGraphPage() {
  const [graph, setGraph] = useState<KnowledgeGraphResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  useEffect(() => {
    void loadGraph()
  }, [])

  useEffect(() => {
    if (!selectedNode && graph?.nodes?.length) {
      setSelectedNode(graph.nodes[0])
    }
  }, [graph, selectedNode])

  const loadGraph = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/knowledge-graph")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch knowledge graph")
      }

      setGraph(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to fetch knowledge graph")
    } finally {
      setLoading(false)
    }
  }

  const syncGraph = async () => {
    setSyncing(true)
    setError(null)

    try {
      const response = await fetch("/api/knowledge-graph/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ force: false }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to build knowledge graph")
      }

      setGraph(data)
      if (data.nodes?.length > 0) {
        setSelectedNode(data.nodes[0])
      }
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Failed to build knowledge graph")
    } finally {
      setSyncing(false)
    }
  }

  const repositoryGroups = (() => {
    const groups = new Map<string, GraphNode[]>()
    for (const node of graph?.nodes || []) {
      const bucket = groups.get(node.repoFullName) || []
      bucket.push(node)
      groups.set(node.repoFullName, bucket)
    }
    return Array.from(groups.entries())
  })()

  const positions = (() => {
    const output: Record<string, { x: number; y: number }> = {}
    let currentY = 80

    for (const [, nodes] of repositoryGroups) {
      const repositoryNode = nodes.find((node) => node.type === "repository")
      const workflowNodes = nodes.filter((node) => node.type === "workflow")
      const languageNodes = nodes.filter((node) => node.type === "language")
      const findingNodes = nodes.filter((node) => node.type === "ci_issue" || node.type === "suggestion")

      const tallestColumn = Math.max(
        workflowNodes.length,
        languageNodes.length,
        findingNodes.length,
        1,
      )

      const groupHeight = Math.max(220, tallestColumn * 86 + 40)
      const centerY = currentY + groupHeight / 2

      if (repositoryNode) {
        output[repositoryNode.id] = { x: 140, y: centerY }
      }

      languageNodes.forEach((node, index) => {
        output[node.id] = { x: 390, y: currentY + 60 + index * 86 }
      })

      workflowNodes.forEach((node, index) => {
        output[node.id] = { x: 650, y: currentY + 60 + index * 86 }
      })

      findingNodes.forEach((node, index) => {
        output[node.id] = { x: 910, y: currentY + 60 + index * 86 }
      })

      currentY += groupHeight + 48
    }

    return {
      positions: output,
      height: Math.max(currentY, 400),
    }
  })()

  const selectedNodeDetails = selectedNode
    ? Object.entries(selectedNode.properties || {})
    : []

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Knowledge Graph</h2>
          <p>
            Build a local graph database from AI CTO analysis and inspect repository relationships visually.
          </p>
        </div>
        <div className="topbar-right">
          <button className="topbar-btn" onClick={() => void loadGraph()}>
            Refresh
          </button>
          <button className="topbar-btn primary" onClick={() => void syncGraph()} disabled={syncing}>
            {syncing ? "Analyzing..." : "Build Knowledge Graph"}
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
            <p style={{ color: "var(--red)", fontSize: ".82rem" }}>{error}</p>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <div className="dash-card">
            <div className="dash-card-body">
              <p className="dash-card-title">Analyzed Repositories</p>
              <p className="metric-value" style={{ color: "var(--accent)" }}>
                {graph?.stats.analyzedRepositories ?? 0}
              </p>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-body">
              <p className="dash-card-title">Graph Nodes</p>
              <p className="metric-value" style={{ color: "var(--cyan)" }}>
                {graph?.stats.graphNodes ?? 0}
              </p>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-body">
              <p className="dash-card-title">Graph Edges</p>
              <p className="metric-value" style={{ color: "var(--green)" }}>
                {graph?.stats.graphEdges ?? 0}
              </p>
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-card-body">
              <p className="dash-card-title">Failed Analyses</p>
              <p className="metric-value" style={{ color: "var(--orange)" }}>
                {graph?.stats.failedRepositories ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "18px", alignItems: "start" }}>
          <div className="dash-card" style={{ minHeight: "620px", overflow: "hidden" }}>
            <div className="dash-card-header">
              <p className="dash-card-title">Local Graph</p>
            </div>
            <div className="dash-card-body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                  Loading graph...
                </div>
              ) : !graph || graph.nodes.length === 0 ? (
                <div style={{ padding: "48px 36px", textAlign: "center", color: "var(--text-muted)" }}>
                  <p style={{ fontSize: ".95rem", color: "var(--text-primary)" }}>
                    No knowledge graph has been built yet.
                  </p>
                  <p style={{ marginTop: "10px", fontSize: ".74rem" }}>
                    Use the button above. On the first run, the app will analyze the current user&apos;s repositories with AI CTO, save the graph locally, and render it here.
                  </p>
                </div>
              ) : (
                <div style={{ overflow: "auto" }}>
                  <svg
                    width="1120"
                    height={positions.height}
                    viewBox={`0 0 1120 ${positions.height}`}
                    style={{ display: "block", minWidth: "1120px", background: "var(--bg-deepest)" }}
                  >
                    <defs>
                      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {(graph.edges || []).map((edge) => {
                      const source = positions.positions[edge.source]
                      const target = positions.positions[edge.target]
                      if (!source || !target) {
                        return null
                      }

                      return (
                        <line
                          key={edge.id}
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="2"
                        />
                      )
                    })}

                    {(graph.nodes || []).map((node) => {
                      const position = positions.positions[node.id]
                      if (!position) {
                        return null
                      }

                      const isSelected = selectedNode?.id === node.id
                      const fill = nodeColors[node.type] || "#94a3b8"

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${position.x}, ${position.y})`}
                          onClick={() => setSelectedNode(node)}
                          style={{ cursor: "pointer" }}
                        >
                          <rect
                            x={-72}
                            y={-28}
                            rx="18"
                            width="144"
                            height="56"
                            fill="rgba(9,15,24,0.92)"
                            stroke={isSelected ? fill : "rgba(255,255,255,0.12)"}
                            strokeWidth={isSelected ? 3 : 1.4}
                          />
                          <circle cx={-48} cy={0} r="8" fill={fill} />
                          <text
                            x={-30}
                            y={-3}
                            fill="#f8fafc"
                            fontSize="12"
                            fontWeight="700"
                            fontFamily="monospace"
                          >
                            {node.label.slice(0, 18)}
                          </text>
                          <text
                            x={-30}
                            y={14}
                            fill="rgba(255,255,255,0.58)"
                            fontSize="10"
                            fontFamily="monospace"
                          >
                            {node.type}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: "18px" }}>
            <div className="dash-card">
              <div className="dash-card-header">
                <p className="dash-card-title">Node Details</p>
              </div>
              <div className="dash-card-body">
                {selectedNode ? (
                  <div style={{ display: "grid", gap: "14px" }}>
                    <div>
                      <p style={{ fontSize: ".9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {selectedNode.label}
                      </p>
                      <p style={{ fontSize: ".68rem", color: nodeColors[selectedNode.type] || "var(--text-muted)", marginTop: "4px" }}>
                        {selectedNode.type}
                      </p>
                    </div>

                    <div style={{ display: "grid", gap: "8px" }}>
                      {selectedNodeDetails.length === 0 ? (
                        <p style={{ color: "var(--text-muted)", fontSize: ".72rem" }}>
                          No extra properties stored for this node.
                        </p>
                      ) : (
                        selectedNodeDetails.map(([key, value]) => (
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
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontSize: ".74rem" }}>
                    Select a node in the graph to inspect its stored properties.
                  </p>
                )}
              </div>
            </div>

            <div className="dash-card">
              <div className="dash-card-header">
                <p className="dash-card-title">Analysis Cache</p>
              </div>
              <div className="dash-card-body" style={{ display: "grid", gap: "10px" }}>
                {(graph?.analyses || []).length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: ".74rem" }}>
                    No repository analyses have been saved yet.
                  </p>
                ) : (
                  graph?.analyses.map((analysis) => (
                    <div
                      key={analysis.repoFullName}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <p style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {analysis.repoFullName}
                      </p>
                      <p style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {analysis.status === "completed"
                          ? analysis.summary || "Analysis saved locally."
                          : analysis.lastError || "Analysis failed."}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
