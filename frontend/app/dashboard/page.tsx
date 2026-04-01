"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/lib/use-session"

interface GitHubOrg {
  id: string
  login: string
  avatar_url: string
  url: string
}

interface ConnectedOrg {
  id: string
  name: string
  slug: string
  githubOrgId: string
  githubOrgAvatar?: string
  connectedAt: string
  role: string
}

const mockMetrics = [
  { label: "Active Repos", value: "24", delta: "+3", trend: "up", color: "teal" },
  { label: "Pipeline Runs", value: "1,284", delta: "+12%", trend: "up", color: "green" },
  { label: "Success Rate", value: "94.2%", delta: "+2.1%", trend: "up", color: "cyan" },
  { label: "Avg Build Time", value: "4m 32s", delta: "-18s", trend: "up", color: "purple" },
]

const mockActivity = [
  { repo: "api-gateway", action: "Deploy succeeded", time: "2 min ago", status: "success" },
  { repo: "frontend-app", action: "Build failed", time: "15 min ago", status: "error" },
  { repo: "auth-service", action: "Pipeline triggered", time: "32 min ago", status: "pending" },
  { repo: "data-processor", action: "Deploy succeeded", time: "1 hr ago", status: "success" },
  { repo: "notification-svc", action: "Test passed", time: "2 hr ago", status: "success" },
]

export default function OverviewPage() {
  const { session } = useSession()
  const [githubOrgs, setGithubOrgs] = useState<GitHubOrg[]>([])
  const [connectedOrgs, setConnectedOrgs] = useState<ConnectedOrg[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(false)
  const [connectingOrg, setConnectingOrg] = useState<string | null>(null)
  const [showOrgPicker, setShowOrgPicker] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchConnectedOrgs()
  }, [])

  const fetchConnectedOrgs = async () => {
    try {
      const res = await fetch("/api/orgs")
      if (res.ok) {
        const data = await res.json()
        setConnectedOrgs(data.organizations || [])
      }
    } catch (err) {
      console.error("Failed to fetch connected orgs:", err)
    }
  }

  const fetchGitHubOrgs = async () => {
    setLoadingOrgs(true)
    setError(null)
    try {
      const res = await fetch("/api/github/orgs")
      if (!res.ok) {
        throw new Error("Failed to fetch GitHub organizations")
      }
      const data = await res.json()
      setGithubOrgs(data.organizations || [])
      setShowOrgPicker(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoadingOrgs(false)
    }
  }

  const connectOrg = async (org: GitHubOrg) => {
    setConnectingOrg(org.id)
    setError(null)
    try {
      const res = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubOrgId: org.id,
          githubOrgName: org.login,
          githubOrgAvatar: org.avatar_url,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to connect organization")
      }

      setSuccess(`Successfully connected ${org.login}`)
      setShowOrgPicker(false)
      fetchConnectedOrgs()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setConnectingOrg(null)
    }
  }

  const disconnectOrg = async (orgId: string) => {
    try {
      const res = await fetch(`/api/orgs/${orgId}`, { method: "DELETE" })
      if (res.ok) {
        setSuccess("Organization disconnected")
        fetchConnectedOrgs()
      }
    } catch (err) {
      setError("Failed to disconnect organization")
    }
  }

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Overview</h2>
          <p>Welcome back, {session?.user?.name || "User"} — here's what's happening today</p>
        </div>
        <div className="topbar-right">
          <button className="topbar-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Export Report
          </button>
          <button className="topbar-btn primary" onClick={fetchGitHubOrgs} disabled={loadingOrgs}>
            + {loadingOrgs ? "Loading..." : "Connect Repo"}
          </button>
        </div>
      </div>

      <div className="dash-content">
        {error && (
          <div className="dash-card" style={{ padding: "16px 22px", background: "rgba(248,113,113,.1)", borderColor: "rgba(248,113,113,.2)" }}>
            <p style={{ color: "var(--red)", fontSize: ".82rem" }}>{error}</p>
          </div>
        )}

        {success && (
          <div className="dash-card" style={{ padding: "16px 22px", background: "rgba(52,211,153,.1)", borderColor: "rgba(52,211,153,.2)" }}>
            <p style={{ color: "var(--green)", fontSize: ".82rem" }}>{success}</p>
          </div>
        )}

        <div className="metrics-row">
          {mockMetrics.map((metric, i) => (
            <div key={metric.label} className={`dash-card metric-card ${metric.color} dash-animate-in dash-delay-${i + 1}`}>
              <div className="dash-card-body">
                <p className="dash-card-title">{metric.label}</p>
                <p className="metric-value" style={{ color: "var(--accent)" }}>{metric.value}</p>
                <div className={`metric-delta ${metric.trend}`}>
                  {metric.trend === "up" ? "↑" : "↓"} {metric.delta}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="middle-row">
          <div className="dash-card dash-animate-in dash-delay-5">
            <div className="dash-card-header">
              <p className="dash-card-title">Recent Activity</p>
              <span className="dash-card-badge">Live</span>
            </div>
            <div className="dash-card-body">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Repository</th>
                      <th>Action</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockActivity.map((item, i) => (
                      <tr key={i}>
                        <td>{item.repo}</td>
                        <td>{item.action}</td>
                        <td>
                          <span className={`tag ${item.status === "success" ? "fix" : item.status === "error" ? "alert" : "observe"}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="dash-card dash-animate-in dash-delay-6">
            <div className="dash-card-header">
              <p className="dash-card-title">Connected Organizations</p>
            </div>
            <div className="dash-card-body">
              {connectedOrgs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>
                  <p>No organizations connected</p>
                  <button
                    onClick={fetchGitHubOrgs}
                    className="topbar-btn primary"
                    style={{ marginTop: "16px" }}
                  >
                    Connect GitHub Org
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {connectedOrgs.map((org) => (
                    <div
                      key={org.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        background: "var(--bg-surface)",
                        borderRadius: "8px",
                        border: "1px solid var(--border)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {org.githubOrgAvatar && (
                          <img src={org.githubOrgAvatar} alt={org.name} style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
                        )}
                        <div>
                          <p style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text-primary)" }}>{org.name}</p>
                          <p style={{ fontSize: ".68rem", color: "var(--text-muted)" }}>
                            Connected {new Date(org.connectedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => disconnectOrg(org.id)}
                        style={{
                          padding: "6px 12px",
                          fontSize: ".72rem",
                          background: "transparent",
                          border: "1px solid rgba(248,113,113,.2)",
                          borderRadius: "6px",
                          color: "var(--red)",
                          cursor: "pointer"
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bottom-row">
          <div className="dash-card dash-animate-in dash-delay-7">
            <div className="dash-card-header">
              <p className="dash-card-title">Deployment Frequency</p>
              <span className="dash-card-badge">This Week</span>
            </div>
            <div className="dash-card-body">
              <div className="freq-list">
                {[
                  { label: "Monday", value: 12, max: 20 },
                  { label: "Tuesday", value: 18, max: 20 },
                  { label: "Wednesday", value: 8, max: 20 },
                  { label: "Thursday", value: 15, max: 20 },
                  { label: "Friday", value: 20, max: 20 },
                ].map((day) => (
                  <div key={day.label} className="freq-item">
                    <span className="freq-label">{day.label}</span>
                    <div className="freq-bar-track">
                      <div className="freq-bar-fill" style={{ width: `${(day.value / day.max) * 100}%` }} />
                    </div>
                    <span className="freq-value">{day.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dash-card dash-animate-in dash-delay-7">
            <div className="dash-card-header">
              <p className="dash-card-title">Quick Actions</p>
            </div>
            <div className="dash-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { label: "New Repository", icon: "+", desc: "Add a new repo to monitor" },
                  { label: "Create Pipeline", icon: "▶", desc: "Set up a new CI/CD pipeline" },
                  { label: "View Analytics", icon: "◉", desc: "Check deployment analytics" },
                  { label: "Get Support", icon: "?", desc: "Chat with AI assistant" },
                ].map((action) => (
                  <button
                    key={action.label}
                    style={{
                      padding: "16px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      textAlign: "left",
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
                    <div style={{ fontSize: "1.2rem", color: "var(--accent)", marginBottom: "8px" }}>{action.icon}</div>
                    <p style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--text-primary)" }}>{action.label}</p>
                    <p style={{ fontSize: ".65rem", color: "var(--text-muted)", marginTop: "4px" }}>{action.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showOrgPicker && (
        <div className="fixed inset-0" style={{ background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div className="dash-card" style={{ width: "100%", maxWidth: "480px", maxHeight: "80vh", overflow: "hidden" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: ".92rem", fontWeight: 700, color: "var(--text-primary)" }}>Select GitHub Organization</h3>
              <button
                onClick={() => setShowOrgPicker(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "18px 22px", overflowY: "auto", maxHeight: "60vh" }}>
              {githubOrgs.length === 0 ? (
                <p style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>No organizations found</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {githubOrgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => connectOrg(org)}
                      disabled={connectingOrg === org.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 14px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        textAlign: "left",
                        opacity: connectingOrg === org.id ? 0.5 : 1
                      }}
                    >
                      <img src={org.avatar_url} alt={org.login} style={{ width: "36px", height: "36px", borderRadius: "8px" }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text-primary)" }}>{org.login}</p>
                        <p style={{ fontSize: ".68rem", color: "var(--text-muted)" }}>{org.url}</p>
                      </div>
                      {connectingOrg === org.id && (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2DD4BF] border-t-transparent" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
