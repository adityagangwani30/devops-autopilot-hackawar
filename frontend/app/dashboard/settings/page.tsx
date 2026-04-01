"use client"

import { useState } from "react"
import { useSession } from "@/lib/use-session"

export default function SettingsPage() {
  const { session } = useSession()
  const [activeTab, setActiveTab] = useState("profile")
  const [notifications, setNotifications] = useState({
    email: true,
    slack: true,
    deployments: true,
    failures: true,
    weekly: false
  })

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "security", label: "Security" },
    { id: "notifications", label: "Notifications" },
    { id: "preferences", label: "Preferences" },
    { id: "api", label: "API Keys" },
  ]

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>Settings</h2>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      <div className="dash-content" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "24px" }}>
        <div className="dash-card dash-animate-in" style={{ padding: "12px", height: "fit-content" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: activeTab === tab.id ? "var(--accent-dim)" : "transparent",
                border: activeTab === tab.id ? "1px solid var(--border-glow)" : "1px solid transparent",
                borderRadius: "8px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: ".82rem",
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? "var(--accent)" : "var(--text-secondary)",
                transition: "all .2s",
                marginBottom: "4px"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="dash-card dash-animate-in dash-delay-1">
          {activeTab === "profile" && (
            <>
              <div className="dash-card-header">
                <p className="dash-card-title">Profile Information</p>
              </div>
              <div className="dash-card-body">
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      style={{ width: "80px", height: "80px", borderRadius: "16px" }}
                    />
                  ) : (
                    <div style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, var(--purple), var(--orange))",
                      display: "grid",
                      placeItems: "center",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text-primary)"
                    }}>
                      {session?.user?.name?.[0] || "U"}
                    </div>
                  )}
                  <div>
                    <button className="topbar-btn primary" style={{ marginBottom: "8px" }}>
                      Change Avatar
                    </button>
                    <p style={{ fontSize: ".68rem", color: "var(--text-muted)" }}>JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue={session?.user?.name || ""}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                        fontSize: ".82rem",
                        outline: "none"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue={session?.user?.email || ""}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                        fontSize: ".82rem",
                        outline: "none"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Company
                    </label>
                    <input
                      type="text"
                      placeholder="Your company"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                        fontSize: ".82rem",
                        outline: "none"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Timezone
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                        fontSize: ".82rem",
                        outline: "none"
                      }}
                    >
                      <option>UTC (GMT)</option>
                      <option>US/Eastern</option>
                      <option>US/Pacific</option>
                      <option>Europe/London</option>
                      <option>Asia/Tokyo</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                  <button className="topbar-btn primary">Save Changes</button>
                </div>
              </div>
            </>
          )}

          {activeTab === "security" && (
            <>
              <div className="dash-card-header">
                <p className="dash-card-title">Security Settings</p>
              </div>
              <div className="dash-card-body">
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
                    Change Password
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <input
                      type="password"
                      placeholder="Current password"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                        fontSize: ".82rem",
                        outline: "none"
                      }}
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                        fontSize: ".82rem",
                        outline: "none"
                      }}
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                        fontSize: ".82rem",
                        outline: "none"
                      }}
                    />
                    <button className="topbar-btn primary" style={{ alignSelf: "flex-start" }}>
                      Update Password
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
                  <h3 style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
                    Two-Factor Authentication
                  </h3>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    background: "var(--bg-surface)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)"
                  }}>
                    <div>
                      <p style={{ fontSize: ".78rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                        2FA is currently disabled
                      </p>
                      <p style={{ fontSize: ".68rem", color: "var(--text-muted)" }}>
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button className="topbar-btn primary">Enable 2FA</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              <div className="dash-card-header">
                <p className="dash-card-title">Notification Preferences</p>
              </div>
              <div className="dash-card-body">
                {Object.entries(notifications).map(([key, value]) => (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 0",
                      borderBottom: "1px solid var(--border)"
                    }}
                  >
                    <div>
                      <p style={{ fontSize: ".82rem", fontWeight: 500, color: "var(--text-primary)", textTransform: "capitalize" }}>
                        {key === "email" ? "Email Notifications" :
                         key === "slack" ? "Slack Notifications" :
                         key === "deployments" ? "Deployment Updates" :
                         key === "failures" ? "Failure Alerts" : "Weekly Summary"}
                      </p>
                      <p style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {key === "email" ? "Receive updates via email" :
                         key === "slack" ? "Get notified in your Slack workspace" :
                         key === "deployments" ? "Notify when deployments complete" :
                         key === "failures" ? "Alert on build or deployment failures" : "Send weekly summary report"}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                      style={{
                        width: "44px",
                        height: "24px",
                        borderRadius: "12px",
                        background: value ? "var(--accent)" : "var(--bg-surface)",
                        border: `1px solid ${value ? "var(--accent)" : "var(--border)"}`,
                        position: "relative",
                        cursor: "pointer",
                        transition: "all .2s"
                      }}
                    >
                      <span style={{
                        position: "absolute",
                        top: "2px",
                        left: value ? "22px" : "2px",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "white",
                        transition: "left .2s"
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "preferences" && (
            <>
              <div className="dash-card-header">
                <p className="dash-card-title">Application Preferences</p>
              </div>
              <div className="dash-card-body">
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
                    Theme
                  </label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    {["dark", "light", "system"].map((theme) => (
                      <button
                        key={theme}
                        className="topbar-btn primary"
                        style={{
                          flex: 1,
                          textTransform: "capitalize",
                          background: theme === "dark" ? "var(--accent)" : "var(--bg-surface)",
                          borderColor: theme === "dark" ? "var(--accent)" : "var(--border)"
                        }}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
                    Default Organization
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      fontSize: ".82rem",
                      outline: "none"
                    }}
                  >
                    <option>Select organization</option>
                    <option>My Organization</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: ".72rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
                    Auto-refresh Dashboard
                  </label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    {[30, 60, 120].map((seconds) => (
                      <button
                        key={seconds}
                        className="topbar-btn"
                        style={{
                          flex: 1,
                          background: seconds === 60 ? "var(--accent-dim)" : "var(--bg-surface)",
                          borderColor: seconds === 60 ? "var(--border-glow)" : "var(--border)"
                        }}
                      >
                        {seconds}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "api" && (
            <>
              <div className="dash-card-header">
                <p className="dash-card-title">API Keys</p>
              </div>
              <div className="dash-card-body">
                <div style={{
                  padding: "16px",
                  background: "var(--bg-surface)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  marginBottom: "20px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div>
                      <p style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text-primary)" }}>Production Key</p>
                      <p style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: "2px" }}>Created Jan 15, 2024</p>
                    </div>
                    <span className="status-pill active" style={{ marginTop: 0 }}>
                      <span className="dot" />
                      Active
                    </span>
                  </div>
                  <code style={{
                    display: "block",
                    padding: "10px 12px",
                    background: "var(--bg-deep)",
                    borderRadius: "6px",
                    fontSize: ".72rem",
                    fontFamily: "var(--font-mono)",
                    color: "var(--accent)"
                  }}>
                    da_live_••••••••••••••••••••••••
                  </code>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="topbar-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                    Copy
                  </button>
                  <button className="topbar-btn" style={{ color: "var(--orange)" }}>
                    Regenerate
                  </button>
                  <button className="topbar-btn" style={{ color: "var(--red)" }}>
                    Revoke
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
