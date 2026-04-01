"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "@/lib/use-session"

const navItems = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Overview", icon: "grid" },
      { href: "/dashboard/repositories", label: "Repositories", icon: "folder", badge: "12" },
      { href: "/dashboard/chatbot", label: "Chatbot", icon: "message", badge: "3" },
      { href: "/dashboard/knowledge-graph", label: "Knowledge Graph", icon: "network" },
    ]
  },
  {
    label: "Configure",
    items: [
      { href: "/dashboard/integrations", label: "Integrations", icon: "plug" },
      { href: "/dashboard/pipelines", label: "Pipelines", icon: "git-branch" },
      { href: "/dashboard/analytics", label: "Analytics", icon: "bar-chart" },
    ]
  },
  {
    label: "System",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: "settings" },
    ]
  }
]

const icons: Record<string, React.ReactElement> = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
    </svg>
  ),
  network: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="12" x2="5" y2="16" />
      <line x1="12" y1="12" x2="19" y2="16" />
    </svg>
  ),
  plug: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a6 6 0 01-6 6v0a6 6 0 01-6-6V8z" />
    </svg>
  ),
  "git-branch": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 01-9 9" />
    </svg>
  ),
  "bar-chart": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
}

export default function Sidebar() {
  const pathname = usePathname()
  const { session, signOut } = useSession()

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <aside className="dash-sidebar">
      <div className="sidebar-brand">
        <div className="logo">DA</div>
        <h1>
          DevOps Autopilot
          <span>AI-Powered CI/CD</span>
        </h1>
      </div>

      <nav className="dash-sidebar-nav">
        {navItems.map((section) => (
          <div key={section.label}>
            <div className="nav-label">{section.label}</div>
            {section.items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`dash-nav-item ${isActive ? "active" : ""}`}
                >
                  <span className="icon">{icons[item.icon]}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`badge ${item.badge === "3" ? "warn" : ""}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="avatar"
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div className="avatar">
            {session?.user?.name ? getInitials(session.user.name) : "U"}
          </div>
        )}
        <div className="user-info">
          <div className="user-name">{session?.user?.name || "User"}</div>
          <div className="user-role">Administrator</div>
        </div>
        <div className="status-dot" />
      </div>
    </aside>
  )
}
