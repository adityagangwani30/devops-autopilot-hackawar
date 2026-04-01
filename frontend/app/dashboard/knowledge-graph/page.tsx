"use client"

import { useState } from "react"

interface Node {
  id: string
  label: string
  type: "repo" | "service" | "pipeline" | "deploy"
  connections: string[]
}

const mockNodes: Node[] = [
  { id: "api-gateway", label: "api-gateway", type: "repo", connections: ["auth-service", "user-service", "data-processor"] },
  { id: "frontend-app", label: "frontend-app", type: "repo", connections: ["api-gateway", "notification-svc"] },
  { id: "auth-service", label: "auth-service", type: "service", connections: ["api-gateway", "user-service"] },
  { id: "user-service", label: "user-service", type: "service", connections: ["api-gateway", "payment-gateway"] },
  { id: "data-processor", label: "data-processor", type: "service", connections: ["ml-pipeline", "notification-svc"] },
  { id: "notification-svc", label: "notification-svc", type: "service", connections: ["frontend-app", "data-processor"] },
  { id: "ml-pipeline", label: "ml-pipeline", type: "pipeline", connections: ["data-processor"] },
  { id: "payment-gateway", label: "payment-gateway", type: "deploy", connections: ["user-service"] },
]

const typeColors = {
  repo: "var(--accent)",
  service: "var(--purple)",
  pipeline: "var(--cyan)",
  deploy: "var(--green)"
}

export default function KnowledgeGraphPage() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [zoom, setZoom] = useState(1)
  const [filter, setFilter] = useState<string | null>(null)

  const filteredNodes = filter
    ? mockNodes.filter(n => n.type === filter)
    : mockNodes

  const getConnections = (nodeId: string) => {
    const node = mockNodes.find(n => n.id === nodeId)
    return node?.connections.map(id => mockNodes.find(n => n.id === id)).filter(Boolean) || []
  }

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Knowledge Graph</h2>
          <p>Visualize relationships between your services and repositories</p>
        </div>
        <div className="topbar-right">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="topbar-btn"
              style={{ padding: "8px 12px" }}
            >
              −
            </button>
            <span style={{ fontSize: ".72rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", minWidth: "40px", textAlign: "center" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
              className="topbar-btn"
              style={{ padding: "8px 12px" }}
            >
              +
            </button>
          </div>
          <button className="topbar-btn primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      <div className="dash-content" style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", height: "calc(100vh - 80px)" }}>
          <div className="dash-animate-in" style={{ position: "relative", background: "var(--bg-deepest)", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
                  radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)
                `,
                backgroundSize: "40px 40px",
                transform: `scale(${zoom})`,
                transformOrigin: "center"
              }}
            />

            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${zoom})`
            }}>
              <svg width="800" height="500" viewBox="0 0 800 500">
                {mockNodes.map((node) =>
                  node.connections.map((connId) => {
                    const targetNode = mockNodes.find(n => n.id === connId)
                    if (!targetNode) return null
                    const startX = 100 + mockNodes.indexOf(node) * 100
                    const startY = 100 + (node.type === "repo" ? 0 : node.type === "service" ? 150 : node.type === "pipeline" ? 300 : 450) % 400
                    const endX = 100 + mockNodes.indexOf(targetNode) * 100
                    const endY = 100 + (targetNode.type === "repo" ? 0 : targetNode.type === "service" ? 150 : targetNode.type === "pipeline" ? 300 : 450) % 400
                    return (
                      <line
                        key={`${node.id}-${connId}`}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="var(--border-glow)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )
                  })
                )}

                {mockNodes.map((node, i) => (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    style={{ cursor: "pointer" }}
                    transform={`translate(${50 + (i % 4) * 180}, ${80 + Math.floor(i / 4) * 180})`}
                  >
                    <circle
                      r="40"
                      fill="var(--bg-card)"
                      stroke={selectedNode?.id === node.id ? typeColors[node.type] : "var(--border)"}
                      strokeWidth={selectedNode?.id === node.id ? 3 : 1}
                      style={{
                        filter: selectedNode?.id === node.id ? `drop-shadow(0 0 12px ${typeColors[node.type]})` : "none",
                        transition: "all .25s"
                      }}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="var(--text-primary)"
                      fontSize="24"
                      fontFamily="var(--font-mono)"
                    >
                      {node.label.slice(0, 2).toUpperCase()}
                    </text>
                    <text
                      y="55"
                      textAnchor="middle"
                      fill="var(--text-secondary)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "8px",
              background: "var(--bg-card)",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border)"
            }}>
              {["repo", "service", "pipeline", "deploy"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(filter === type ? null : type)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    background: filter === type ? "var(--accent-dim)" : "transparent",
                    border: filter === type ? `1px solid ${typeColors[type as keyof typeof typeColors]}` : "1px solid transparent",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: ".72rem",
                    color: "var(--text-secondary)",
                    textTransform: "capitalize"
                  }}
                >
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: typeColors[type as keyof typeof typeColors] }} />
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="dash-card" style={{ borderRadius: 0, borderLeft: "1px solid var(--border)", borderTop: "none", borderRight: "none", borderBottom: "none" }}>
            <div className="dash-card-header" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
              <p className="dash-card-title">Node Details</p>
            </div>
            <div className="dash-card-body">
              {selectedNode ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        background: "var(--bg-surface)",
                        border: `2px solid ${typeColors[selectedNode.type]}`,
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--text-primary)"
                      }}>
                        {selectedNode.label.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: ".92rem", fontWeight: 600, color: "var(--text-primary)" }}>{selectedNode.label}</p>
                        <p style={{ fontSize: ".68rem", color: typeColors[selectedNode.type], textTransform: "capitalize" }}>{selectedNode.type}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="dash-card-title" style={{ marginBottom: "10px" }}>Connections ({selectedNode.connections.length})</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {selectedNode.connections.map((connId) => {
                        const conn = mockNodes.find(n => n.id === connId)
                        if (!conn) return null
                        return (
                          <div
                            key={connId}
                            onClick={() => setSelectedNode(conn)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 12px",
                              background: "var(--bg-surface)",
                              borderRadius: "8px",
                              border: "1px solid var(--border)",
                              cursor: "pointer",
                              transition: "all .25s"
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = "var(--border-glow)"
                              e.currentTarget.style.background = "var(--accent-dim)"
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = "var(--border)"
                              e.currentTarget.style.background = "var(--bg-surface)"
                            }}
                          >
                            <span style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: typeColors[conn.type]
                            }} />
                            <span style={{ fontSize: ".78rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                              {conn.label}
                            </span>
                            <span style={{
                              marginLeft: "auto",
                              fontSize: ".6rem",
                              color: "var(--text-muted)",
                              textTransform: "capitalize"
                            }}>
                              {conn.type}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="dash-card-title" style={{ marginBottom: "10px" }}>Stats</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div style={{ padding: "12px", background: "var(--bg-surface)", borderRadius: "8px", textAlign: "center" }}>
                        <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>
                          {selectedNode.connections.length}
                        </p>
                        <p style={{ fontSize: ".62rem", color: "var(--text-muted)" }}>Outgoing</p>
                      </div>
                      <div style={{ padding: "12px", background: "var(--bg-surface)", borderRadius: "8px", textAlign: "center" }}>
                        <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--purple)", fontFamily: "var(--font-mono)" }}>
                          {getConnections(selectedNode.id).length}
                        </p>
                        <p style={{ fontSize: ".62rem", color: "var(--text-muted)" }}>Incoming</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 16px", opacity: 0.5 }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8M12 8v8" />
                  </svg>
                  <p style={{ fontSize: ".82rem" }}>Select a node to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
