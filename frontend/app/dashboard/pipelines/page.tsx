"use client"

import { useState } from "react"

const pipelines = [
  { id: "1", name: "Production Deploy", repo: "api-gateway", status: "running", duration: "2m 34s", lastRun: "2 min ago", branch: "main", commit: "a1b2c3d" },
  { id: "2", name: "Staging Deploy", repo: "frontend-app", status: "success", duration: "4m 12s", lastRun: "15 min ago", branch: "develop", commit: "e4f5g6h" },
  { id: "3", name: "Test Suite", repo: "auth-service", status: "success", duration: "1m 48s", lastRun: "1 hr ago", branch: "main", commit: "i7j8k9l" },
  { id: "4", name: "Build & Push", repo: "data-processor", status: "failed", duration: "3m 22s", lastRun: "2 hr ago", branch: "feature/ml", commit: "m0n1o2p" },
  { id: "5", name: "Deploy Preview", repo: "notification-svc", status: "pending", duration: "-", lastRun: "30 min ago", branch: "feature/notif", commit: "q3r4s5t" },
]

const statusColors = {
  running: "var(--cyan)",
  success: "var(--green)",
  failed: "var(--red)",
  pending: "var(--orange)"
}

export default function PipelinesPage() {
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null)

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Pipelines</h2>
          <p>Manage and monitor your CI/CD pipelines</p>
        </div>
        <div className="topbar-right">
          <button className="topbar-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 4h18M3 8h18M3 12h18M3 16h18M3 20h18" />
            </svg>
            Filter
          </button>
          <button className="topbar-btn primary">
            + New Pipeline
          </button>
        </div>
      </div>

      <div className="dash-content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }} className="dash-animate-in">
          <div className="dash-card metric-card teal">
            <div className="dash-card-body">
              <p className="dash-card-title">Total Runs</p>
              <p className="metric-value" style={{ color: "var(--accent)" }}>1,284</p>
              <div className="metric-delta up">↑ 12%</div>
            </div>
          </div>
          <div className="dash-card metric-card green">
            <div className="dash-card-body">
              <p className="dash-card-title">Success Rate</p>
              <p className="metric-value" style={{ color: "var(--green)" }}>94.2%</p>
              <div className="metric-delta up">↑ 2.1%</div>
            </div>
          </div>
          <div className="dash-card metric-card purple">
            <div className="dash-card-body">
              <p className="dash-card-title">Avg Duration</p>
              <p className="metric-value" style={{ color: "var(--purple)" }}>4m 32s</p>
              <div className="metric-delta up">↓ 18s</div>
            </div>
          </div>
          <div className="dash-card metric-card cyan">
            <div className="dash-card-body">
              <p className="dash-card-title">Active Now</p>
              <p className="metric-value" style={{ color: "var(--cyan)" }}>1</p>
              <span className="status-pill active">
                <span className="dot" />
                Running
              </span>
            </div>
          </div>
        </div>

        <div className="dash-card dash-animate-in dash-delay-1">
          <div className="dash-card-header">
            <p className="dash-card-title">All Pipelines</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="topbar-btn" style={{ padding: "6px 12px", fontSize: ".72rem" }}>
                All
              </button>
              <button className="topbar-btn" style={{ padding: "6px 12px", fontSize: ".72rem", background: "var(--accent-dim)", borderColor: "var(--border-glow)" }}>
                Running
              </button>
              <button className="topbar-btn" style={{ padding: "6px 12px", fontSize: ".72rem" }}>
                Failed
              </button>
            </div>
          </div>
          <div className="dash-card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pipeline</th>
                    <th>Repository</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Last Run</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelines.map((pipeline) => (
                    <tr key={pipeline.id}>
                      <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{pipeline.name}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{pipeline.repo}</td>
                      <td>
                        <span style={{
                          padding: "4px 8px",
                          background: "var(--bg-surface)",
                          borderRadius: "4px",
                          fontSize: ".68rem",
                          fontFamily: "var(--font-mono)"
                        }}>
                          {pipeline.branch}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: statusColors[pipeline.status as keyof typeof statusColors],
                            boxShadow: `0 0 8px ${statusColors[pipeline.status as keyof typeof statusColors]}`
                          }} />
                          <span style={{ textTransform: "capitalize", color: statusColors[pipeline.status as keyof typeof statusColors] }}>
                            {pipeline.status}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{pipeline.duration}</td>
                      <td>{pipeline.lastRun}</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {pipeline.status === "running" ? (
                            <button className="topbar-btn" style={{ padding: "4px 8px", fontSize: ".68rem", color: "var(--red)" }}>
                              Stop
                            </button>
                          ) : (
                            <button className="topbar-btn" style={{ padding: "4px 8px", fontSize: ".68rem" }}>
                              Run
                            </button>
                          )}
                          <button className="topbar-btn" style={{ padding: "4px 8px", fontSize: ".68rem" }}>
                            Logs
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dash-card dash-animate-in dash-delay-2">
          <div className="dash-card-header">
            <p className="dash-card-title">Pipeline Configuration</p>
          </div>
          <div className="dash-card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <p style={{ fontSize: ".72rem", color: "var(--text-muted)", marginBottom: "8px" }}>Stages</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {["Build", "Test", "Security Scan", "Deploy"].map((stage, i) => (
                    <div key={stage} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      background: "var(--bg-surface)",
                      borderRadius: "8px"
                    }}>
                      <span style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "var(--accent-dim)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: ".68rem",
                        fontWeight: 700,
                        color: "var(--accent)"
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: ".78rem", color: "var(--text-primary)" }}>{stage}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: ".72rem", color: "var(--text-muted)", marginBottom: "8px" }}>Environment</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { name: "NODE_ENV", value: "production" },
                    { name: "DATABASE_URL", value: "••••••••" },
                    { name: "API_KEY", value: "••••••••" },
                    { name: "AWS_REGION", value: "us-east-1" },
                  ].map((env) => (
                    <div key={env.name} style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "var(--bg-surface)",
                      borderRadius: "8px"
                    }}>
                      <span style={{ fontSize: ".72rem", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{env.name}</span>
                      <span style={{ fontSize: ".72rem", fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{env.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
