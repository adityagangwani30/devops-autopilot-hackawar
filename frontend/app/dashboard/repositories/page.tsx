"use client"

import { useState } from "react"
import { useSession } from "@/lib/use-session"

const mockRepos = [
  { name: "api-gateway", language: "Go", stars: 234, branches: 12, issues: 3, lastDeploy: "2h ago", status: "healthy" },
  { name: "frontend-app", language: "TypeScript", stars: 567, branches: 8, issues: 7, lastDeploy: "15m ago", status: "warning" },
  { name: "auth-service", language: "Rust", stars: 89, branches: 4, issues: 1, lastDeploy: "1d ago", status: "healthy" },
  { name: "data-processor", language: "Python", stars: 342, branches: 6, issues: 0, lastDeploy: "3h ago", status: "healthy" },
  { name: "notification-svc", language: "Node.js", stars: 156, branches: 3, issues: 2, lastDeploy: "6h ago", status: "healthy" },
  { name: "ml-pipeline", language: "Python", stars: 423, branches: 5, issues: 4, lastDeploy: "12h ago", status: "warning" },
  { name: "payment-gateway", language: "Java", stars: 198, branches: 7, issues: 1, lastDeploy: "4h ago", status: "healthy" },
  { name: "user-service", language: "Go", stars: 267, branches: 4, issues: 0, lastDeploy: "8h ago", status: "healthy" },
]

const languageColors: Record<string, string> = {
  "Go": "#00ADD8",
  "TypeScript": "#3178C6",
  "Rust": "#DEA584",
  "Python": "#3572A5",
  "Node.js": "#68A063",
  "Java": "#B07219",
}

export default function RepositoriesPage() {
  const { session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)

  const filteredRepos = mockRepos.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLanguage = !selectedLanguage || repo.language === selectedLanguage
    return matchesSearch && matchesLanguage
  })

  const languages = [...new Set(mockRepos.map(r => r.language))]

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Repositories</h2>
          <p>Manage and monitor your connected GitHub repositories</p>
        </div>
        <div className="topbar-right">
          <button className="topbar-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
          <button className="topbar-btn primary">
            + Add Repository
          </button>
        </div>
      </div>

      <div className="dash-content">
        <div className="dash-card dash-animate-in">
          <div className="dash-card-body" style={{ paddingBottom: 0 }}>
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
                <svg
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 40px",
                    background: "var(--bg-deep)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: ".82rem",
                    outline: "none"
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setSelectedLanguage(null)}
                  className={`topbar-btn ${!selectedLanguage ? "primary" : ""}`}
                  style={{ padding: "10px 16px" }}
                >
                  All
                </button>
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={`topbar-btn ${selectedLanguage === lang ? "primary" : ""}`}
                    style={{ padding: "10px 16px" }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: languageColors[lang],
                        marginRight: "6px"
                      }}
                    />
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dash-card dash-animate-in dash-delay-1">
          <div className="dash-card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Repository</th>
                    <th>Language</th>
                    <th>Stars</th>
                    <th>Branches</th>
                    <th>Issues</th>
                    <th>Last Deploy</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepos.map((repo) => (
                    <tr key={repo.name}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                        {repo.name}
                      </td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background: languageColors[repo.language]
                            }}
                          />
                          {repo.language}
                        </span>
                      </td>
                      <td>{repo.stars.toLocaleString()}</td>
                      <td>{repo.branches}</td>
                      <td>
                        <span className={`tag ${repo.issues === 0 ? "fix" : repo.issues > 5 ? "alert" : "observe"}`}>
                          {repo.issues}
                        </span>
                      </td>
                      <td>{repo.lastDeploy}</td>
                      <td>
                        <span className="status-pill active">
                          <span className="dot" />
                          {repo.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button className="topbar-btn" style={{ padding: "6px 10px", fontSize: ".68rem" }}>
                            View
                          </button>
                          <button className="topbar-btn" style={{ padding: "6px 10px", fontSize: ".68rem" }}>
                            Settings
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
          <div className="dash-card dash-card dash-animate-in dash-delay-2">
            <div className="dash-card-header">
              <p className="dash-card-title">Total Repositories</p>
            </div>
            <div className="dash-card-body">
              <p className="metric-value" style={{ color: "var(--accent)" }}>{mockRepos.length}</p>
              <p style={{ fontSize: ".7rem", color: "var(--text-muted)", marginTop: "8px" }}>Across {languages.length} languages</p>
            </div>
          </div>
          <div className="dash-card dash-animate-in dash-delay-3">
            <div className="dash-card-header">
              <p className="dash-card-title">Open Issues</p>
            </div>
            <div className="dash-card-body">
              <p className="metric-value" style={{ color: "var(--orange)" }}>{mockRepos.reduce((sum, r) => sum + r.issues, 0)}</p>
              <p style={{ fontSize: ".7rem", color: "var(--text-muted)", marginTop: "8px" }}>Across all repos</p>
            </div>
          </div>
          <div className="dash-card dash-animate-in dash-delay-4">
            <div className="dash-card-header">
              <p className="dash-card-title">Healthy Status</p>
            </div>
            <div className="dash-card-body">
              <p className="metric-value" style={{ color: "var(--green)" }}>{mockRepos.filter(r => r.status === "healthy").length}/{mockRepos.length}</p>
              <div className="mini-progress">
                <div
                  className="fill"
                  style={{ width: `${(mockRepos.filter(r => r.status === "healthy").length / mockRepos.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
