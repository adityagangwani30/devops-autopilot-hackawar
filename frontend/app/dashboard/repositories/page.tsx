"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/lib/use-session"

interface RepositoryRow {
  id: string
  fullName: string
  ownerLogin: string
  ownerAvatarUrl: string | null
  description: string | null
  htmlUrl: string
  isPrivate: boolean
  visibility: string | null
  defaultBranch: string
  primaryLanguage: string | null
  updatedAt: string
  analysisStatus: string
  analysisSummary: string | null
  analyzedAt: string | null
  lastError: string | null
}

interface IssuePreview {
  title: string
  url: string | null
  updatedAt: string | null
}

interface AnalysisResponse {
  repository: string
  summary: string
  analyzedAt: string
  issuesCount: number
  workflowsCount: number
  suggestionsCount: number
  ciIssuesCount: number
  workflowNames: string[]
  issueTitles: IssuePreview[]
  readmeSummary: string | null
  readmePreview: string | null
  analysis: string | null
  suggestions: string[]
  ciIssues: Array<Record<string, unknown>>
  costAdvisor: {
    provider: string
    model: string
    repositories_analyzed: number
    advice: string
    fallback?: boolean
    error?: string | null
    report: {
      repo_name: string
      deployed_env: string
      criticality_tier: string
      monthly_cost_usd: number
      unit_economics: {
        monthly_active_users: number
        cost_per_1k_users: number
      }
      infrastructure: {
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
    } | null
  } | null
}

type DrawerTab = "overview" | "findings" | "readme" | "costs"

interface DrawerState {
  isOpen: boolean
  loading: boolean
  error: string | null
  repo: RepositoryRow | null
  result: AnalysisResponse | null
  tab: DrawerTab
}

const surfaceCard = {
  padding: "16px",
  background: "var(--bg-surface)",
  borderRadius: "12px",
  border: "1px solid var(--border)",
}

const listItem = {
  padding: "12px 14px",
  background: "var(--bg-card)",
  borderRadius: "10px",
  border: "1px solid var(--border)",
}

const emptyDrawer: DrawerState = {
  isOpen: false,
  loading: false,
  error: null,
  repo: null,
  result: null,
  tab: "overview",
}

function ciIssueSummary(issue: Record<string, unknown>) {
  return {
    title: typeof issue.title === "string"
      ? issue.title
      : typeof issue.issue === "string"
        ? issue.issue
        : "Uncategorized CI finding",
    workflow: typeof issue.workflow === "string" ? issue.workflow : null,
    severity: typeof issue.severity === "string" ? issue.severity : null,
  }
}

function MetricTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={surfaceCard}>
      <p className="dash-card-title">{label}</p>
      <p style={{ marginTop: "10px", fontSize: "1.35rem", fontWeight: 700, color }}>
        {value}
      </p>
    </div>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button className={`topbar-btn ${active ? "primary" : ""}`} onClick={onClick}>
      {label}
    </button>
  )
}

function DrawerSkeleton() {
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="dash-card shimmer" style={{ minHeight: "86px" }} />
        ))}
      </div>
      <div className="dash-card shimmer" style={{ minHeight: "120px" }} />
      <div className="dash-card shimmer" style={{ minHeight: "180px" }} />
    </div>
  )
}

export default function RepositoriesPage() {
  const { session } = useSession()
  const [repositories, setRepositories] = useState<RepositoryRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [analyzingRepository, setAnalyzingRepository] = useState<string | null>(null)
  const [analyzingAll, setAnalyzingAll] = useState(false)
  const [analyzeAllProgress, setAnalyzeAllProgress] = useState({ current: 0, total: 0 })
  const [drawer, setDrawer] = useState<DrawerState>(emptyDrawer)

  useEffect(() => {
    void loadRepositories()
  }, [])

  useEffect(() => {
    if (!drawer.isOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [drawer.isOpen])

  const loadRepositories = async () => {
    setLoading(true)
    setPageError(null)
    try {
      const response = await fetch("/api/github/repos")
      const data = await response.json()
      
      if (!response.ok && response.status !== 200) {
        setPageError(data.error || "Failed to fetch repositories")
        setRepositories([])
        setLoading(false)
        return
      }
      
      setRepositories(data.repositories || [])
      
      if (data.error) {
        setPageError(data.error)
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Failed to fetch repositories")
    } finally {
      setLoading(false)
    }
  }

  const closeDrawer = () => setDrawer(emptyDrawer)

  const analyzeRepository = async (repo: RepositoryRow) => {
    setAnalyzingRepository(repo.fullName)
    setDrawer({
      isOpen: true,
      loading: true,
      error: null,
      repo,
      result: null,
      tab: "overview",
    })

    try {
      const response = await fetch("/api/repositories/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoFullName: repo.fullName }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Repository analysis failed")
      }

      setRepositories((current) =>
        current.map((item) =>
          item.fullName === repo.fullName
            ? {
                ...item,
                analysisStatus: "completed",
                analysisSummary: data.summary,
                analyzedAt: data.analyzedAt,
                lastError: null,
              }
            : item,
        ),
      )

      setDrawer({
        isOpen: true,
        loading: false,
        error: null,
        repo,
        result: data as AnalysisResponse,
        tab: "overview",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Repository analysis failed"
      setRepositories((current) =>
        current.map((item) =>
          item.fullName === repo.fullName
            ? { ...item, analysisStatus: "failed", lastError: message }
            : item,
        ),
      )
      setDrawer({
        isOpen: true,
        loading: false,
        error: message,
        repo,
        result: null,
        tab: "overview",
      })
    } finally {
      setAnalyzingRepository(null)
    }
  }

  const analyzeAllRepositories = async () => {
    const unanalyzed = repositories.filter((repo) => repo.analysisStatus !== "completed")
    if (unanalyzed.length === 0) {
      // Re-analyze all if everything is already analyzed
      const toAnalyze = repositories
      setAnalyzingAll(true)
      setAnalyzeAllProgress({ current: 0, total: toAnalyze.length })

      for (let i = 0; i < toAnalyze.length; i++) {
        const repo = toAnalyze[i]
        setAnalyzeAllProgress({ current: i + 1, total: toAnalyze.length })
        setAnalyzingRepository(repo.fullName)
        try {
          const response = await fetch("/api/repositories/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repoFullName: repo.fullName }),
          })
          const data = await response.json()
          if (response.ok) {
            setRepositories((current) =>
              current.map((item) =>
                item.fullName === repo.fullName
                  ? { ...item, analysisStatus: "completed", analysisSummary: data.summary, analyzedAt: data.analyzedAt, lastError: null }
                  : item
              )
            )
          }
        } catch {
          // Continue with next repo
        }
      }
      setAnalyzingAll(false)
      setAnalyzingRepository(null)
      return
    }

    setAnalyzingAll(true)
    setAnalyzeAllProgress({ current: 0, total: unanalyzed.length })

    for (let i = 0; i < unanalyzed.length; i++) {
      const repo = unanalyzed[i]
      setAnalyzeAllProgress({ current: i + 1, total: unanalyzed.length })
      setAnalyzingRepository(repo.fullName)

      try {
        const response = await fetch("/api/repositories/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoFullName: repo.fullName }),
        })
        const data = await response.json()
        if (response.ok) {
          setRepositories((current) =>
            current.map((item) =>
              item.fullName === repo.fullName
                ? { ...item, analysisStatus: "completed", analysisSummary: data.summary, analyzedAt: data.analyzedAt, lastError: null }
                : item
            )
          )
        } else {
          setRepositories((current) =>
            current.map((item) =>
              item.fullName === repo.fullName
                ? { ...item, analysisStatus: "failed", lastError: data.error || "Analysis failed" }
                : item
            )
          )
        }
      } catch {
        setRepositories((current) =>
          current.map((item) =>
            item.fullName === repo.fullName
              ? { ...item, analysisStatus: "failed", lastError: "Network error" }
              : item
          )
        )
      }
    }

    setAnalyzingAll(false)
    setAnalyzingRepository(null)
  }

  const filteredRepositories = repositories.filter((repo) => {
    const query = searchQuery.trim().toLowerCase()
    return !query || repo.fullName.toLowerCase().includes(query) || repo.primaryLanguage?.toLowerCase().includes(query) || repo.description?.toLowerCase().includes(query)
  })

  const analyzedCount = repositories.filter((repo) => repo.analysisStatus === "completed").length
  const result = drawer.result

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Repositories</h2>
          <p>Analyze repositories for {session?.user?.name || "your account"} and inspect the output in a live sidebar.</p>
        </div>
        <div className="topbar-right">
          <button className="topbar-btn" onClick={() => void loadRepositories()}>
            Refresh
          </button>
          <button
            className="topbar-btn primary"
            onClick={() => void analyzeAllRepositories()}
            disabled={analyzingAll || loading || repositories.length === 0}
            style={{ minWidth: "140px" }}
          >
            {analyzingAll
              ? `Analyzing ${analyzeAllProgress.current}/${analyzeAllProgress.total}...`
              : "Analyze All"}
          </button>
        </div>
      </div>

      <div className="dash-content">
        {pageError ? (
          <div className="dash-card" style={{ padding: "16px 22px", background: "rgba(248,113,113,.08)", borderColor: "rgba(248,113,113,.2)" }}>
            <p style={{ color: "var(--red)", fontSize: ".82rem" }}>{pageError}</p>
          </div>
        ) : null}

        <div className="dash-card dash-animate-in">
          <div className="dash-card-body">
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: "260px" }}>
                <input
                  type="text"
                  placeholder="Search repositories by name, language, or description"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  style={{ width: "100%", padding: "12px 14px", background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-primary)", fontSize: ".82rem", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <div className="topbar-btn" style={{ cursor: "default" }}>{repositories.length} repos</div>
                <div className="topbar-btn" style={{ cursor: "default" }}>{analyzedCount} analyzed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="dash-card dash-animate-in dash-delay-1">
          <div className="dash-card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>Loading repositories...</div>
            ) : filteredRepositories.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>No repositories matched your search.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Repository</th>
                      <th>Visibility</th>
                      <th>Language</th>
                      <th>Updated</th>
                      <th>Analysis</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRepositories.map((repo) => {
                      const isAnalyzing = analyzingRepository === repo.fullName
                      return (
                        <tr key={repo.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              {repo.ownerAvatarUrl ? <img src={repo.ownerAvatarUrl} alt={repo.ownerLogin} style={{ width: "36px", height: "36px", borderRadius: "10px" }} /> : null}
                              <div>
                                <p style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text-primary)" }}>{repo.fullName}</p>
                                <p style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: "4px" }}>{repo.description || `Default branch: ${repo.defaultBranch}`}</p>
                              </div>
                            </div>
                          </td>
                          <td><span className="tag">{repo.isPrivate ? "private" : repo.visibility || "public"}</span></td>
                          <td>{repo.primaryLanguage || "Unknown"}</td>
                          <td>{new Date(repo.updatedAt).toLocaleDateString()}</td>
                          <td>
                            {repo.analysisStatus === "completed" ? (
                              <div>
                                <p style={{ color: "var(--green)", fontSize: ".75rem", fontWeight: 600 }}>Analyzed</p>
                                <p style={{ fontSize: ".65rem", color: "var(--text-muted)", marginTop: "4px" }}>{repo.analyzedAt ? new Date(repo.analyzedAt).toLocaleString() : "Saved locally"}</p>
                              </div>
                            ) : repo.analysisStatus === "failed" ? (
                              <div>
                                <p style={{ color: "var(--red)", fontSize: ".75rem", fontWeight: 600 }}>Failed</p>
                                <p style={{ fontSize: ".65rem", color: "var(--text-muted)", marginTop: "4px" }}>{repo.lastError || "Try again"}</p>
                              </div>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>Not analyzed</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button className="topbar-btn primary" onClick={() => void analyzeRepository(repo)} disabled={isAnalyzing} style={{ padding: "8px 12px", minWidth: "92px" }}>
                                {isAnalyzing ? "Running..." : "Analyze"}
                              </button>
                              <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="topbar-btn" style={{ padding: "8px 12px" }}>
                                Open
                              </a>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {drawer.isOpen ? (
        <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,.62)", backdropFilter: "blur(6px)", zIndex: 220 }}>
          <aside onClick={(event) => event.stopPropagation()} style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "min(460px, calc(100vw - 24px))", background: "var(--bg-card)", borderLeft: "1px solid var(--border)", boxShadow: "-24px 0 70px rgba(2,6,23,.35)", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--border)", background: "linear-gradient(180deg, rgba(45,212,191,.08), rgba(20,28,48,.88) 55%)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div>
                  <p style={{ fontSize: ".68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>Repository Analysis</p>
                  <h3 style={{ marginTop: "8px", fontSize: "1.02rem", fontWeight: 700, color: "var(--text-primary)" }}>{drawer.repo?.fullName || "Selected repository"}</h3>
                  <p style={{ marginTop: "6px", fontSize: ".72rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>{drawer.repo?.description || "AI CTO is analyzing issues, workflows, and README content."}</p>
                </div>
                <button onClick={closeDrawer} className="topbar-btn" style={{ padding: "8px 10px", flexShrink: 0 }}>X</button>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
                <span className="dash-card-badge">{drawer.repo?.primaryLanguage || "Unknown"}</span>
                <span className="dash-card-badge">{drawer.repo?.isPrivate ? "private" : drawer.repo?.visibility || "public"}</span>
                {result?.analyzedAt ? <span className="dash-card-badge">{new Date(result.analyzedAt).toLocaleString()}</span> : null}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px 28px" }}>
              {drawer.loading ? <DrawerSkeleton /> : null}

              {!drawer.loading && drawer.error ? (
                <div style={{ display: "grid", gap: "16px" }}>
                  <div className="dash-card" style={{ padding: "18px", background: "rgba(248,113,113,.08)", borderColor: "rgba(248,113,113,.2)" }}>
                    <p style={{ color: "var(--red)", fontSize: ".82rem", fontWeight: 600 }}>Analysis failed</p>
                    <p style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: ".76rem", lineHeight: 1.6 }}>{drawer.error}</p>
                  </div>
                  {drawer.repo ? <button className="topbar-btn primary" onClick={() => void analyzeRepository(drawer.repo as RepositoryRow)} style={{ width: "100%", justifyContent: "center", padding: "12px 16px" }}>Retry Analysis</button> : null}
                </div>
              ) : null}

              {!drawer.loading && !drawer.error && result ? (
                <div style={{ display: "grid", gap: "18px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                    <MetricTile label="Open Issues" value={result.issuesCount} color="var(--orange)" />
                    <MetricTile label="CI Workflows" value={result.workflowsCount} color="var(--cyan)" />
                    <MetricTile label="Suggestions" value={result.suggestionsCount} color="var(--accent)" />
                    <MetricTile label="CI Findings" value={result.ciIssuesCount} color="var(--yellow)" />
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <TabButton active={drawer.tab === "overview"} label="Overview" onClick={() => setDrawer((current) => ({ ...current, tab: "overview" }))} />
                    <TabButton active={drawer.tab === "findings"} label="Findings" onClick={() => setDrawer((current) => ({ ...current, tab: "findings" }))} />
                    <TabButton active={drawer.tab === "readme"} label="README" onClick={() => setDrawer((current) => ({ ...current, tab: "readme" }))} />
                    <TabButton active={drawer.tab === "costs"} label="Costs" onClick={() => setDrawer((current) => ({ ...current, tab: "costs" }))} />
                  </div>

                  {drawer.tab === "overview" ? (
                    <div style={{ display: "grid", gap: "16px" }}>
                      <div style={surfaceCard}>
                        <p className="dash-card-title">AI Summary</p>
                        <p style={{ marginTop: "10px", fontSize: ".78rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>{result.summary}</p>
                      </div>
                      <div style={surfaceCard}>
                        <p className="dash-card-title">Detailed Analysis</p>
                        <pre style={{ marginTop: "12px", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", fontSize: ".7rem", lineHeight: 1.75, color: "var(--text-secondary)" }}>
                          {result.analysis || "Detailed analysis was not returned for this repository."}
                        </pre>
                      </div>
                    </div>
                  ) : null}

                  {drawer.tab === "findings" ? (
                    <div style={{ display: "grid", gap: "16px" }}>
                      <div style={surfaceCard}>
                        <p className="dash-card-title">GitHub Issues</p>
                        <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
                          {result.issueTitles.length > 0 ? result.issueTitles.map((issue) => (
                            <div key={`${issue.title}-${issue.updatedAt || "unknown"}`} style={listItem}>
                              {issue.url ? (
                                <a href={issue.url} target="_blank" rel="noreferrer" style={{ color: "var(--text-primary)", fontSize: ".76rem", fontWeight: 600, textDecoration: "none" }}>{issue.title}</a>
                              ) : (
                                <p style={{ color: "var(--text-primary)", fontSize: ".76rem", fontWeight: 600 }}>{issue.title}</p>
                              )}
                              <p style={{ marginTop: "6px", color: "var(--text-muted)", fontSize: ".66rem" }}>{issue.updatedAt ? `Updated ${new Date(issue.updatedAt).toLocaleDateString()}` : "No recent timestamp available"}</p>
                            </div>
                          )) : <p style={{ color: "var(--text-muted)", fontSize: ".74rem" }}>No GitHub issue details were returned in this analysis.</p>}
                        </div>
                      </div>

                      <div style={surfaceCard}>
                        <p className="dash-card-title">CI Workflows</p>
                        <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
                          {result.workflowNames.length > 0 ? result.workflowNames.map((workflow) => (
                            <div key={workflow} style={{ ...listItem, color: "var(--text-secondary)", fontSize: ".74rem", fontFamily: "var(--font-mono)" }}>{workflow}</div>
                          )) : <p style={{ color: "var(--text-muted)", fontSize: ".74rem" }}>No GitHub Actions workflows were detected.</p>}
                        </div>
                      </div>

                      <div style={surfaceCard}>
                        <p className="dash-card-title">CI Findings</p>
                        <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
                          {result.ciIssues.length > 0 ? result.ciIssues.map((rawIssue, index) => {
                            const issue = ciIssueSummary(rawIssue)
                            return (
                              <div key={`${issue.title}-${index}`} style={listItem}>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                                  <p style={{ fontSize: ".76rem", color: "var(--text-primary)", fontWeight: 600 }}>{issue.title}</p>
                                  {issue.severity ? <span className="tag observe">{issue.severity}</span> : null}
                                </div>
                                <p style={{ marginTop: "6px", color: "var(--text-muted)", fontSize: ".68rem" }}>{issue.workflow || "Applies across workflow configuration"}</p>
                              </div>
                            )
                          }) : <p style={{ color: "var(--text-muted)", fontSize: ".74rem" }}>No CI-specific issues were identified.</p>}
                        </div>
                      </div>

                      <div style={surfaceCard}>
                        <p className="dash-card-title">AI Suggestions</p>
                        <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
                          {result.suggestions.length > 0 ? result.suggestions.map((suggestion, index) => (
                            <div key={`${suggestion}-${index}`} style={{ ...listItem, color: "var(--text-secondary)", fontSize: ".76rem", lineHeight: 1.65 }}>{suggestion}</div>
                          )) : <p style={{ color: "var(--text-muted)", fontSize: ".74rem" }}>No AI suggestions were returned for this run.</p>}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {drawer.tab === "readme" ? (
                    <div style={{ display: "grid", gap: "16px" }}>
                      <div style={surfaceCard}>
                        <p className="dash-card-title">README Summary</p>
                        <p style={{ marginTop: "10px", fontSize: ".78rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>{result.readmeSummary || "README content was not available for this repository."}</p>
                      </div>
                      <div style={surfaceCard}>
                        <p className="dash-card-title">README Excerpt</p>
                        <pre style={{ marginTop: "12px", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)", fontSize: ".7rem", lineHeight: 1.8, color: "var(--text-secondary)" }}>
                          {result.readmePreview || "No README excerpt was returned."}
                        </pre>
                      </div>
                    </div>
                  ) : null}

                  {drawer.tab === "costs" ? (
                    <div style={{ display: "grid", gap: "16px" }}>
                      <div style={surfaceCard}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                          <p className="dash-card-title">Costs Suggestions</p>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {result.costAdvisor?.provider ? <span className="dash-card-badge">{result.costAdvisor.provider}</span> : null}
                            {result.costAdvisor?.fallback ? <span className="dash-card-badge">fallback</span> : null}
                          </div>
                        </div>
                        <p style={{ marginTop: "12px", fontSize: ".78rem", lineHeight: 1.75, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>
                          {result.costAdvisor?.advice || "Cost suggestions are not available yet for this repository."}
                        </p>
                        {result.costAdvisor?.error ? (
                          <p style={{ marginTop: "12px", color: "var(--orange)", fontSize: ".7rem" }}>
                            {result.costAdvisor.error}
                          </p>
                        ) : null}
                      </div>

                      {result.costAdvisor?.report ? (
                        <>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                            <MetricTile label="Est. Monthly Cost" value={Math.round(result.costAdvisor.report.monthly_cost_usd)} color="var(--orange)" />
                            <MetricTile label="MAU" value={result.costAdvisor.report.unit_economics.monthly_active_users} color="var(--cyan)" />
                            <MetricTile label="Cost / 1K Users" value={Math.round(result.costAdvisor.report.unit_economics.cost_per_1k_users)} color="var(--accent)" />
                            <MetricTile label="Peak CPU %" value={Math.round(result.costAdvisor.report.infrastructure.peak_cpu_percent)} color="var(--yellow)" />
                          </div>

                          <div style={surfaceCard}>
                            <p className="dash-card-title">Generated Cost Report</p>
                            <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
                              <div style={listItem}>
                                <p style={{ fontSize: ".72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Deployment</p>
                                <p style={{ marginTop: "6px", color: "var(--text-primary)", fontSize: ".78rem" }}>
                                  {result.costAdvisor.report.deployed_env} / {result.costAdvisor.report.criticality_tier}
                                </p>
                              </div>
                              <div style={listItem}>
                                <p style={{ fontSize: ".72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Compute</p>
                                <p style={{ marginTop: "6px", color: "var(--text-primary)", fontSize: ".78rem" }}>
                                  {result.costAdvisor.report.infrastructure.provider} - {result.costAdvisor.report.infrastructure.provisioned_compute}
                                </p>
                                <p style={{ marginTop: "6px", color: "var(--text-secondary)", fontSize: ".7rem" }}>
                                  Avg CPU {result.costAdvisor.report.infrastructure.avg_cpu_percent}% / Peak CPU {result.costAdvisor.report.infrastructure.peak_cpu_percent}%
                                </p>
                              </div>
                              {result.costAdvisor.report.database ? (
                                <div style={listItem}>
                                  <p style={{ fontSize: ".72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Database</p>
                                  <p style={{ marginTop: "6px", color: "var(--text-primary)", fontSize: ".78rem" }}>
                                    {result.costAdvisor.report.database.type}
                                  </p>
                                  <p style={{ marginTop: "6px", color: "var(--text-secondary)", fontSize: ".7rem" }}>
                                    {result.costAdvisor.report.database.allocated_storage_gb} GB allocated / {result.costAdvisor.report.database.avg_read_iops} avg read IOPS
                                  </p>
                                </div>
                              ) : null}
                              {result.costAdvisor.report.storage ? (
                                <div style={listItem}>
                                  <p style={{ fontSize: ".72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Storage</p>
                                  <p style={{ marginTop: "6px", color: "var(--text-primary)", fontSize: ".78rem" }}>
                                    {result.costAdvisor.report.storage.used_gb} GB used of {result.costAdvisor.report.storage.allocated_gb} GB
                                  </p>
                                  <p style={{ marginTop: "6px", color: "var(--text-secondary)", fontSize: ".7rem" }}>
                                    Last accessed {result.costAdvisor.report.storage.last_accessed_days_ago} days ago
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
