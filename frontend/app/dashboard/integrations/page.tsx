"use client"

import { useState } from "react"

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  category: "git" | "ci-cd" | "monitoring" | "cloud" | "communication"
  status: "connected" | "available" | "disconnected"
  connectedAt?: string
}

const integrations: Integration[] = [
  { id: "github", name: "GitHub", description: "Repository hosting and version control", icon: "🐙", category: "git", status: "connected", connectedAt: "2024-01-15" },
  { id: "gitlab", name: "GitLab", description: "Complete DevOps platform", icon: "🦊", category: "git", status: "available" },
  { id: "jenkins", name: "Jenkins", description: "Automation server for CI/CD", icon: "🔧", category: "ci-cd", status: "available" },
  { id: "circleci", name: "CircleCI", description: "CI/CD platform for modern development", icon: "⚡", category: "ci-cd", status: "available" },
  { id: "datadog", name: "Datadog", description: "Monitoring and security platform", icon: "🐕", category: "monitoring", status: "available" },
  { id: "prometheus", name: "Prometheus", description: "Systems monitoring and alerting", icon: "🔥", category: "monitoring", status: "available" },
  { id: "slack", name: "Slack", description: "Team communication and notifications", icon: "💬", category: "communication", status: "connected", connectedAt: "2024-01-20" },
  { id: "discord", name: "Discord", description: "Community and team chat", icon: "🎮", category: "communication", status: "available" },
  { id: "aws", name: "AWS", description: "Cloud computing services", icon: "☁️", category: "cloud", status: "available" },
  { id: "gcp", name: "Google Cloud", description: "Cloud computing platform", icon: "🌐", category: "cloud", status: "available" },
  { id: "azure", name: "Azure", description: "Microsoft cloud platform", icon: "🔷", category: "cloud", status: "available" },
  { id: "kubernetes", name: "Kubernetes", description: "Container orchestration platform", icon: "☸️", category: "cloud", status: "available" },
]

const categories = [
  { id: "all", label: "All" },
  { id: "git", label: "Git" },
  { id: "ci-cd", label: "CI/CD" },
  { id: "monitoring", label: "Monitoring" },
  { id: "cloud", label: "Cloud" },
  { id: "communication", label: "Communication" },
]

export default function IntegrationsPage() {
  const [filter, setFilter] = useState("all")
  const [showConnectModal, setShowConnectModal] = useState<Integration | null>(null)

  const filteredIntegrations = filter === "all"
    ? integrations
    : integrations.filter(i => i.category === filter)

  const connectedCount = integrations.filter(i => i.status === "connected").length

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Integrations</h2>
          <p>Connect your favorite tools and services</p>
        </div>
        <div className="topbar-right">
          <button className="topbar-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" />
            </svg>
            Browse All
          </button>
          <button className="topbar-btn primary">
            + Add Custom
          </button>
        </div>
      </div>

      <div className="dash-content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }} className="dash-animate-in">
          <div className="dash-card metric-card teal">
            <div className="dash-card-body">
              <p className="dash-card-title">Connected</p>
              <p className="metric-value" style={{ color: "var(--accent)" }}>{connectedCount}</p>
            </div>
          </div>
          <div className="dash-card metric-card green">
            <div className="dash-card-body">
              <p className="dash-card-title">Available</p>
              <p className="metric-value" style={{ color: "var(--green)" }}>{integrations.length - connectedCount}</p>
            </div>
          </div>
          <div className="dash-card metric-card purple">
            <div className="dash-card-body">
              <p className="dash-card-title">Categories</p>
              <p className="metric-value" style={{ color: "var(--purple)" }}>{categories.length - 1}</p>
            </div>
          </div>
          <div className="dash-card metric-card cyan">
            <div className="dash-card-body">
              <p className="dash-card-title">Webhooks</p>
              <p className="metric-value" style={{ color: "var(--cyan)" }}>{connectedCount * 3}</p>
            </div>
          </div>
        </div>

        <div className="dash-card dash-animate-in dash-delay-1">
          <div className="dash-card-body" style={{ paddingBottom: 0 }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`topbar-btn ${filter === cat.id ? "primary" : ""}`}
                  style={{ padding: "8px 16px" }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
          {filteredIntegrations.map((integration, i) => (
            <div
              key={integration.id}
              className={`dash-card dash-animate-in dash-delay-${(i % 6) + 1}`}
              style={{
                padding: "20px",
                transition: "all .25s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--border-glow)"
                e.currentTarget.style.transform = "translateY(-2px)"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--border)"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "var(--bg-surface)",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "1.5rem"
                }}>
                  {integration.icon}
                </div>
                <span className={`status-pill ${integration.status === "connected" ? "active" : ""}`} style={{ marginTop: 0 }}>
                  {integration.status === "connected" && <span className="dot" />}
                  {integration.status}
                </span>
              </div>

              <h3 style={{ fontSize: ".92rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                {integration.name}
              </h3>
              <p style={{ fontSize: ".72rem", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.5 }}>
                {integration.description}
              </p>

              {integration.status === "connected" ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="topbar-btn"
                    style={{ flex: 1, justifyContent: "center", padding: "8px 12px", fontSize: ".72rem" }}
                  >
                    Configure
                  </button>
                  <button
                    style={{
                      padding: "8px 12px",
                      background: "transparent",
                      border: "1px solid rgba(248,113,113,.2)",
                      borderRadius: "8px",
                      color: "var(--red)",
                      fontSize: ".72rem",
                      cursor: "pointer"
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConnectModal(integration)}
                  className="topbar-btn primary"
                  style={{ width: "100%", justifyContent: "center", padding: "10px" }}
                >
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="dash-card dash-animate-in dash-delay-6">
          <div className="dash-card-header">
            <p className="dash-card-title">API Access</p>
          </div>
          <div className="dash-card-body">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: ".82rem", color: "var(--text-primary)", marginBottom: "4px" }}>API Key</p>
                <p style={{ fontSize: ".68rem", color: "var(--text-muted)" }}>Use this key to authenticate API requests</p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <code style={{
                  padding: "8px 12px",
                  background: "var(--bg-surface)",
                  borderRadius: "6px",
                  fontSize: ".72rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent)"
                }}>
                  da_live_••••••••••••
                </code>
                <button className="topbar-btn">Regenerate</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConnectModal && (
        <div className="fixed inset-0" style={{ background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div className="dash-card" style={{ width: "100%", maxWidth: "420px" }}>
            <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: ".92rem", fontWeight: 600, color: "var(--text-primary)" }}>
                Connect {showConnectModal.name}
              </h3>
              <p style={{ fontSize: ".72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                {showConnectModal.description}
              </p>
            </div>
            <div className="dash-card-body">
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  API Token
                </label>
                <input
                  type="password"
                  placeholder={`Enter your ${showConnectModal.name} API token`}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: ".82rem",
                    outline: "none"
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowConnectModal(null)}
                  className="topbar-btn"
                >
                  Cancel
                </button>
                <button className="topbar-btn primary">
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
