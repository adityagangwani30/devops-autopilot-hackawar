"use client"

import { useState } from "react"

const weeklyData = [
  { day: "Mon", builds: 24, deploys: 8, success: 92 },
  { day: "Tue", builds: 32, deploys: 12, success: 88 },
  { day: "Wed", builds: 28, deploys: 10, success: 95 },
  { day: "Thu", builds: 36, deploys: 14, success: 91 },
  { day: "Fri", builds: 40, deploys: 16, success: 94 },
  { day: "Sat", builds: 16, deploys: 6, success: 100 },
  { day: "Sun", builds: 12, deploys: 4, success: 97 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("week")

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Analytics</h2>
          <p>Monitor your deployment metrics and performance</p>
        </div>
        <div className="topbar-right">
          <div style={{ display: "flex", gap: "4px" }}>
            {["24h", "7d", "30d", "90d"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`topbar-btn ${timeRange === range ? "primary" : ""}`}
                style={{ padding: "6px 12px", fontSize: ".72rem" }}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="topbar-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      <div className="dash-content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px" }} className="dash-animate-in">
          <div className="dash-card metric-card teal">
            <div className="dash-card-body">
              <p className="dash-card-title">Total Builds</p>
              <p className="metric-value" style={{ color: "var(--accent)" }}>1,284</p>
              <div className="metric-delta up">↑ 12% vs last week</div>
            </div>
          </div>
          <div className="dash-card metric-card green">
            <div className="dash-card-body">
              <p className="dash-card-title">Success Rate</p>
              <p className="metric-value" style={{ color: "var(--green)" }}>94.2%</p>
              <div className="metric-delta up">↑ 2.1% vs last week</div>
            </div>
          </div>
          <div className="dash-card metric-card purple">
            <div className="dash-card-body">
              <p className="dash-card-title">Avg Build Time</p>
              <p className="metric-value" style={{ color: "var(--purple)" }}>4m 32s</p>
              <div className="metric-delta up">↓ 18s vs last week</div>
            </div>
          </div>
          <div className="dash-card metric-card cyan">
            <div className="dash-card-body">
              <p className="dash-card-title">Deployments</p>
              <p className="metric-value" style={{ color: "var(--cyan)" }}>70</p>
              <div className="metric-delta up">↑ 8% vs last week</div>
            </div>
          </div>
        </div>

        <div className="dash-card dash-animate-in dash-delay-1">
          <div className="dash-card-header">
            <p className="dash-card-title">Build & Deploy Activity</p>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--accent)" }} />
                <span style={{ fontSize: ".68rem", color: "var(--text-muted)" }}>Builds</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--cyan)" }} />
                <span style={{ fontSize: ".68rem", color: "var(--text-muted)" }}>Deploys</span>
              </div>
            </div>
          </div>
          <div className="dash-card-body">
            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "200px" }}>
              {weeklyData.map((day, i) => (
                <div key={day.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{
                      height: `${(day.builds / 40) * 140}px`,
                      background: "linear-gradient(180deg, var(--accent), var(--accent-dim))",
                      borderRadius: "4px 4px 0 0",
                      transition: "height .5s ease"
                    }} />
                    <div style={{
                      height: `${(day.deploys / 16) * 80}px`,
                      background: "linear-gradient(180deg, var(--cyan), rgba(34,211,238,.2))",
                      borderRadius: "4px 4px 0 0",
                      transition: "height .5s ease",
                      marginTop: "4px"
                    }} />
                  </div>
                  <span style={{ fontSize: ".62rem", color: "var(--text-muted)" }}>{day.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
          <div className="dash-card dash-animate-in dash-delay-2">
            <div className="dash-card-header">
              <p className="dash-card-title">Success Rate by Repository</p>
            </div>
            <div className="dash-card-body">
              <div className="freq-list">
                {[
                  { repo: "api-gateway", rate: 98 },
                  { repo: "frontend-app", rate: 91 },
                  { repo: "auth-service", rate: 95 },
                  { repo: "data-processor", rate: 88 },
                  { repo: "notification-svc", rate: 100 },
                ].map((item) => (
                  <div key={item.repo} className="freq-item">
                    <span className="freq-label">{item.repo}</span>
                    <div className="freq-bar-track">
                      <div
                        className="freq-bar-fill"
                        style={{
                          width: `${item.rate}%`,
                          background: item.rate >= 95
                            ? "linear-gradient(90deg, var(--green), #10B981)"
                            : item.rate >= 85
                              ? "linear-gradient(90deg, var(--accent), var(--cyan))"
                              : "linear-gradient(90deg, var(--orange), var(--yellow))"
                        }}
                      />
                    </div>
                    <span className="freq-value" style={{ color: item.rate >= 95 ? "var(--green)" : item.rate >= 85 ? "var(--accent)" : "var(--orange)" }}>
                      {item.rate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dash-card dash-animate-in dash-delay-3">
            <div className="dash-card-header">
              <p className="dash-card-title">Build Time Distribution</p>
            </div>
            <div className="dash-card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { range: "< 2 min", count: 324, color: "var(--green)" },
                  { range: "2-5 min", count: 512, color: "var(--accent)" },
                  { range: "5-10 min", count: 298, color: "var(--cyan)" },
                  { range: "> 10 min", count: 150, color: "var(--orange)" },
                ].map((item) => (
                  <div key={item.range} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ width: "60px", fontSize: ".72rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {item.range}
                    </span>
                    <div style={{ flex: 1, height: "24px", background: "var(--bg-deep)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${(item.count / 512) * 100}%`,
                        background: item.color,
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: "8px",
                        fontSize: ".62rem",
                        fontFamily: "var(--font-mono)",
                        color: "var(--bg-deepest)",
                        fontWeight: 600
                      }}>
                        {item.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dash-card dash-animate-in dash-delay-4">
          <div className="dash-card-header">
            <p className="dash-card-title">Recent Performance</p>
            <span className="dash-card-badge">Live</span>
          </div>
          <div className="dash-card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Repository</th>
                    <th>Build #</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { time: "14:32", repo: "api-gateway", build: 1247, duration: "3m 42s", status: "success", change: "-12s" },
                    { time: "14:28", repo: "frontend-app", build: 892, duration: "5m 18s", status: "success", change: "+3s" },
                    { time: "14:15", repo: "auth-service", build: 456, duration: "2m 08s", status: "success", change: "-8s" },
                    { time: "14:02", repo: "data-processor", build: 234, duration: "8m 42s", status: "failed", change: "+2m" },
                    { time: "13:58", repo: "notification-svc", build: 189, duration: "1m 54s", status: "success", change: "-5s" },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td>{row.time}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{row.repo}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>#{row.build}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{row.duration}</td>
                      <td>
                        <span className={`tag ${row.status === "success" ? "fix" : "alert"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{
                        fontFamily: "var(--font-mono)",
                        color: row.change.startsWith("-") ? "var(--green)" : "var(--orange)"
                      }}>
                        {row.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
