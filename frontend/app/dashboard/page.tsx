"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import "./dashboard.css"

/* ═══════════════════════════════════════════════════════════════
   Dashboard Page – React conversion of dashboard.html
   Route: /dashboard
   ═══════════════════════════════════════════════════════════════ */

// ── Data ──
const freqData = [
  { label: "git-commit-stream", value: 94 },
  { label: "pr-review-queue", value: 87 },
  { label: "deploy-monitor", value: 76 },
  { label: "test-runner", value: 82 },
  { label: "config-drift", value: 61 },
  { label: "sla-watchdog", value: 73 },
  { label: "cost-optimizer", value: 68 },
  { label: "log-anomaly", value: 55 },
]

const healthData = [
  { label: "CPU Utilization", value: 42, color: "#34D399" },
  { label: "Memory Usage", value: 67, color: "#22D3EE" },
  { label: "Disk I/O", value: 31, color: "#2DD4BF" },
  { label: "Network Throughput", value: 58, color: "#A78BFA" },
  { label: "Pod Count", value: 85, color: "#FB923C", suffix: "" },
  { label: "Error Rate", value: 3, color: "#34D399" },
  { label: "Latency P99", value: 22, color: "#2DD4BF" },
  { label: "Queue Depth", value: 14, color: "#22D3EE" },
]

// ── Utility: Draw bar chart ──
function drawBarChart(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1

  const rect = canvas.parentElement!.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = 240 * dpr
  canvas.style.height = "240px"
  ctx.scale(dpr, dpr)

  const w = rect.width
  const h = 240
  const padding = { top: 20, right: 20, bottom: 44, left: 44 }
  const chartW = w - padding.left - padding.right
  const chartH = h - padding.top - padding.bottom

  const categories = ["Observe", "Reason", "Propose Fix", "Pushback"]
  const thisWeek = [64, 48, 37, 18]
  const lastWeek = [52, 42, 29, 22]
  const maxVal = Math.max(...thisWeek, ...lastWeek) * 1.15

  const barGroupW = chartW / categories.length
  const barW = barGroupW * 0.28
  const gap = 4

  // Grid lines
  ctx.strokeStyle = "rgba(148,163,184,.08)"
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(w - padding.right, y)
    ctx.stroke()
    ctx.fillStyle = "#64748B"
    ctx.font = '10px "JetBrains Mono"'
    ctx.textAlign = "right"
    ctx.fillText(String(Math.round(maxVal - (maxVal / 4) * i)), padding.left - 8, y + 4)
  }

  // Bars
  const roundedRect = (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    if (h <= 0) return
    c.beginPath()
    c.moveTo(x + r, y)
    c.lineTo(x + w - r, y)
    c.quadraticCurveTo(x + w, y, x + w, y + r)
    c.lineTo(x + w, y + h)
    c.lineTo(x, y + h)
    c.lineTo(x, y + r)
    c.quadraticCurveTo(x, y, x + r, y)
    c.closePath()
    c.fill()
  }

  categories.forEach((cat, i) => {
    const x = padding.left + barGroupW * i + (barGroupW - barW * 2 - gap) / 2

    const h1 = (lastWeek[i] / maxVal) * chartH
    const grad1 = ctx.createLinearGradient(0, padding.top + chartH - h1, 0, padding.top + chartH)
    grad1.addColorStop(0, "rgba(45,212,191,.25)")
    grad1.addColorStop(1, "rgba(45,212,191,.08)")
    ctx.fillStyle = grad1
    roundedRect(ctx, x, padding.top + chartH - h1, barW, h1, 4)

    const h2 = (thisWeek[i] / maxVal) * chartH
    const grad2 = ctx.createLinearGradient(0, padding.top + chartH - h2, 0, padding.top + chartH)
    grad2.addColorStop(0, "#2DD4BF")
    grad2.addColorStop(1, "#22D3EE")
    ctx.fillStyle = grad2
    roundedRect(ctx, x + barW + gap, padding.top + chartH - h2, barW, h2, 4)

    ctx.shadowColor = "rgba(45,212,191,.3)"
    ctx.shadowBlur = 10
    ctx.fillStyle = "rgba(45,212,191,.05)"
    roundedRect(ctx, x + barW + gap, padding.top + chartH - h2, barW, h2, 4)
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0

    ctx.fillStyle = "#94A3B8"
    ctx.font = '11px "Inter"'
    ctx.textAlign = "center"
    ctx.fillText(cat, x + barW + gap / 2, h - padding.bottom + 18)
  })

  // Legend
  const legendX = w - padding.right - 140
  const legendY = padding.top
  ctx.fillStyle = "rgba(45,212,191,.15)"
  roundedRect(ctx, legendX, legendY, 10, 10, 2)
  ctx.fillStyle = "#64748B"
  ctx.font = '10px "Inter"'
  ctx.textAlign = "left"
  ctx.fillText("Last Week", legendX + 16, legendY + 9)
  const grad3 = ctx.createLinearGradient(legendX + 80, legendY, legendX + 90, legendY)
  grad3.addColorStop(0, "#2DD4BF")
  grad3.addColorStop(1, "#22D3EE")
  ctx.fillStyle = grad3
  roundedRect(ctx, legendX + 80, legendY, 10, 10, 2)
  ctx.fillStyle = "#94A3B8"
  ctx.fillText("This Week", legendX + 96, legendY + 9)
}

// ── Counting animation hook ──
function useCountAnimation(target: number, duration = 1800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const startTime = performance.now()
    let frame: number
    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])
  return value
}

// ── Bar fill component ──
function FreqBar({
  label,
  value,
  index,
  customColor,
  suffix = "%",
}: {
  label: string
  value: number
  index: number
  customColor?: string
  suffix?: string
}) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 800 + index * 80)
    return () => clearTimeout(t)
  }, [value, index])

  const barStyle: React.CSSProperties = customColor
    ? {
        width: `${width}%`,
        transitionDelay: `${index * 80}ms`,
        background: `linear-gradient(90deg, ${customColor}, ${customColor}cc)`,
        boxShadow: `0 0 14px ${customColor}40`,
      }
    : { width: `${width}%`, transitionDelay: `${index * 80}ms` }

  return (
    <div className="freq-item">
      <span className="freq-label">{label}</span>
      <div className="freq-bar-track">
        <div className="freq-bar-fill" style={barStyle} />
      </div>
      <span className="freq-value" style={customColor ? { color: customColor } : undefined}>
        {value}
        {suffix}
      </span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN DASHBOARD COMPONENT
// ══════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [contextBarWidth, setContextBarWidth] = useState(0)
  const [chatState, setChatState] = useState<"idle" | "approved" | "rejected">("idle")

  const activeTasks = useCountAnimation(412)
  const costAvoided = useCountAnimation(18000)

  // Chart drawing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (canvasRef.current) drawBarChart(canvasRef.current)
    }, 400)
    const handleResize = () => {
      if (canvasRef.current) drawBarChart(canvasRef.current)
    }
    window.addEventListener("resize", handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Context bar animation
  useEffect(() => {
    const t = setTimeout(() => setContextBarWidth(98), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="dashboard-root">
      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* ═══ SIDEBAR ═══ */}
      <aside className="dash-sidebar" id="sidebar">
        <div className="sidebar-brand">
          <div className="logo">DA</div>
          <h1>
            DevOps Autopilot <span>AI-Powered Platform</span>
          </h1>
        </div>

        <nav className="dash-sidebar-nav">
          <div className="nav-label">Core</div>

          <button className="dash-nav-item active" id="nav-agent-status">
            <span className="icon">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.54-7.54-2.83 2.83M7.37 16.63l-2.83 2.83m14.92 0-2.83-2.83M7.37 7.37 4.54 4.54" />
              </svg>
            </span>
            Agent Status
            <span className="badge">Active</span>
          </button>

          <button className="dash-nav-item" id="nav-live-chat">
            <span className="icon">
              <svg viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            Live Chat Thread
            <span className="badge warn">3</span>
          </button>

          <button className="dash-nav-item" id="nav-cicd">
            <span className="icon">
              <svg viewBox="0 0 24 24">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </span>
            CI/CD Observer
          </button>

          <button className="dash-nav-item" id="nav-context">
            <span className="icon">
              <svg viewBox="0 0 24 24">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
            Context Sources
          </button>

          <div className="nav-label">System</div>

          <button className="dash-nav-item" id="nav-config">
            <span className="icon">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            Config
          </button>

          <Link href="/" className="dash-nav-item" style={{ marginTop: "auto" }}>
            <span className="icon">
              <svg viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </span>
            Back to Home
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">OP</div>
          <div className="user-info">
            <div className="user-name">Ops Lead</div>
            <div className="user-role">Platform Engineering</div>
          </div>
          <div className="status-dot" />
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="dash-main">
        {/* Top bar */}
        <header className="dash-topbar">
          <div className="topbar-left">
            <h2>Agent Command Center</h2>
            <p>Real-time autonomous CI/CD intelligence · Last sync 4s ago</p>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn" id="btn-env">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              prod-us-east
            </button>
            <button className="topbar-btn primary" id="btn-deploy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Force Deploy
            </button>
          </div>
        </header>

        {/* Dashboard body */}
        <section className="dash-content">
          {/* ── TOP ROW: METRIC CARDS ── */}
          <div className="metrics-row">
            {/* Active Agent Tasks */}
            <div className="dash-card metric-card teal dash-animate-in dash-delay-1 shimmer" id="card-active-tasks">
              <div className="dash-card-header">
                <span className="dash-card-title">Active Agent Tasks</span>
                <span className="dash-card-badge">LIVE</span>
              </div>
              <div className="dash-card-body">
                <div className="metric-value glow-text" style={{ color: "#2DD4BF" }}>
                  {activeTasks.toLocaleString()}
                </div>
                <span className="metric-delta up">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  +12% from last week
                </span>
              </div>
            </div>

            {/* Live Cost Avoided */}
            <div className="dash-card metric-card green dash-animate-in dash-delay-2 shimmer" id="card-cost-avoided">
              <div className="dash-card-header">
                <span className="dash-card-title">Live Cost Avoided</span>
                <span className="dash-card-badge">SAVINGS</span>
              </div>
              <div className="dash-card-body">
                <div className="metric-value glow-text" style={{ color: "#34D399" }}>
                  ${costAvoided.toLocaleString()}
                </div>
                <div className="metric-sub">Avoided SLA penalties this cycle</div>
              </div>
            </div>

            {/* Pipeline Status */}
            <div className="dash-card metric-card purple dash-animate-in dash-delay-3 shimmer" id="card-pipeline-status">
              <div className="dash-card-header">
                <span className="dash-card-title">Pipeline Status</span>
                <span className="dash-card-badge">ALL CLEAR</span>
              </div>
              <div className="dash-card-body">
                <div className="metric-value" style={{ color: "#A78BFA", fontSize: "1.4rem", marginTop: "16px" }}>
                  Monitoring Active
                </div>
                <div className="status-pill active">
                  <span className="dot" />
                  14 pipelines healthy
                </div>
              </div>
            </div>

            {/* Context Coverage */}
            <div className="dash-card metric-card cyan dash-animate-in dash-delay-4 shimmer" id="card-context-coverage">
              <div className="dash-card-header">
                <span className="dash-card-title">Context Coverage</span>
                <span className="dash-card-badge">98%</span>
              </div>
              <div className="dash-card-body">
                <div className="metric-value glow-text" style={{ color: "#22D3EE" }}>
                  98<span style={{ fontSize: "1.2rem", opacity: 0.6 }}>%</span>
                </div>
                <div className="metric-sub">Git integration depth</div>
                <div className="mini-progress">
                  <div className="fill" style={{ width: `${contextBarWidth}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── MIDDLE ROW: TABLE + CHART ── */}
          <div className="middle-row">
            {/* Interventions table */}
            <div className="dash-card dash-animate-in dash-delay-5" id="card-interventions">
              <div className="dash-card-header">
                <span className="dash-card-title">Recent Agent Interventions</span>
                <span className="dash-card-badge">LAST 24H</span>
              </div>
              <div className="dash-card-body">
                <div className="table-wrap">
                  <table id="interventions-table">
                    <thead>
                      <tr>
                        <th>Pipeline</th>
                        <th>Trigger Event</th>
                        <th>Diagnosis</th>
                        <th>Agent Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Auth-Service</td>
                        <td>Deploy-Main</td>
                        <td>High Blast Radius</td>
                        <td><span className="tag pushback">Pushback</span></td>
                      </tr>
                      <tr>
                        <td>Payment-GW</td>
                        <td>PR-Merge #482</td>
                        <td>Flaky Test Suite</td>
                        <td><span className="tag fix">Auto-Fix</span></td>
                      </tr>
                      <tr>
                        <td>User-Profile</td>
                        <td>Canary-Release</td>
                        <td>Latency Spike +40ms</td>
                        <td><span className="tag observe">Observe</span></td>
                      </tr>
                      <tr>
                        <td>Infra-Core</td>
                        <td>Config-Drift</td>
                        <td>Terraform Mismatch</td>
                        <td><span className="tag fix">Auto-Fix</span></td>
                      </tr>
                      <tr>
                        <td>API-Gateway</td>
                        <td>Scale-Up</td>
                        <td>CPU Spike &gt; 85%</td>
                        <td><span className="tag alert">Alert</span></td>
                      </tr>
                      <tr>
                        <td>ML-Pipeline</td>
                        <td>Model-Retrain</td>
                        <td>Data Skew Detected</td>
                        <td><span className="tag pushback">Pushback</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="dash-card dash-animate-in dash-delay-6" id="card-action-chart">
              <div className="dash-card-header">
                <span className="dash-card-title">Activity by Agent Action</span>
                <span className="dash-card-badge">CORE LOOP</span>
              </div>
              <div className="dash-card-body">
                <div className="chart-container">
                  <canvas ref={canvasRef} id="actionChart" height={240} />
                </div>
              </div>
            </div>
          </div>

          {/* ── BOTTOM ROW: FREQ BARS ── */}
          <div className="bottom-row">
            {/* Agent Task Frequency */}
            <div className="dash-card dash-animate-in dash-delay-7" id="card-task-freq">
              <div className="dash-card-header">
                <span className="dash-card-title">Agent Task Frequency</span>
                <span className="dash-card-badge">STREAMS</span>
              </div>
              <div className="dash-card-body">
                <div className="freq-list">
                  {freqData.map((d, i) => (
                    <FreqBar key={d.label} label={d.label} value={d.value} index={i} />
                  ))}
                </div>
              </div>
            </div>

            {/* System Health Overview */}
            <div className="dash-card dash-animate-in dash-delay-7" id="card-system-health">
              <div className="dash-card-header">
                <span className="dash-card-title">System Health Overview</span>
                <span className="dash-card-badge">REAL-TIME</span>
              </div>
              <div className="dash-card-body">
                <div className="freq-list">
                  {healthData.map((d, i) => (
                    <FreqBar
                      key={d.label}
                      label={d.label}
                      value={d.value}
                      index={i}
                      customColor={d.color}
                      suffix={d.suffix !== undefined ? d.suffix : "%"}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ═══ FLOATING CHAT PANEL ═══ */}
      <div className="chat-panel" id="chat-panel">
        <div className="chat-header">
          <div className="ai-avatar">🤖</div>
          <div>
            <div className="chat-title">AI CTO · Live</div>
            <div className="chat-subtitle">Autonomous DevOps Agent</div>
          </div>
          <div className="chat-status">
            <span
              className="dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#34D399",
                boxShadow: "0 0 8px rgba(52,211,153,.5)",
              }}
            />
            Online
          </div>
        </div>
        <div className="chat-body">
          <div className="chat-msg">
            <div className="msg-avatar">🤖</div>
            <div>
              <div className="msg-bubble">
                <strong>Deploy Gate — Auth-Service:</strong>
                <br />
                I recommend <strong>against</strong> this deploy.{" "}
                <span className="alert-line">Three tests failing in a critical auth module.</span>{" "}
                Override requires your explicit confirmation.
                <br />
                <br />
                <span
                  style={{
                    color: "#64748B",
                    fontSize: ".68rem",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Risk Score:{" "}
                  <span style={{ color: "#F87171", fontWeight: 700 }}>HIGH (0.91)</span> · Blast
                  Radius: 12 services
                </span>
              </div>
              <div className="msg-time">Today 10:14 AM · Agent v3.2.1</div>
            </div>
          </div>
        </div>
        <div className="chat-actions">
          {chatState === "idle" && (
            <>
              <button
                className="chat-btn reject"
                onClick={() => setChatState("rejected")}
              >
                ✕ Reject Deploy
              </button>
              <button
                className="chat-btn approve"
                onClick={() => setChatState("approved")}
              >
                ✓ Approve Override
              </button>
            </>
          )}
          {chatState === "approved" && (
            <button className="chat-btn approve" style={{ opacity: 0.6, pointerEvents: "none" }}>
              ✓ Override Approved
            </button>
          )}
          {chatState === "rejected" && (
            <button
              className="chat-btn reject"
              style={{ background: "rgba(248,113,113,.15)", pointerEvents: "none" }}
            >
              ✕ Deploy Rejected
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
