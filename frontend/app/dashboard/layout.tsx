import { GitHubAuthGate } from "@/components/auth/GitHubAuthGate"
import { SessionProvider } from "@/components/auth/SessionProvider"
import { QueryProvider } from "@/components/QueryProvider"
import Sidebar from "@/components/dashboard/Sidebar"
import { getSession } from "@/lib/auth-session"
import "../dashboard/dashboard.css"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    return (
      <GitHubAuthGate
        title="Authenticate before entering the dashboard"
        description="Use Better Auth with GitHub to unlock the dashboard, repositories, and knowledge graph."
      />
    )
  }

  return (
    <QueryProvider>
      <SessionProvider session={session}>
        <div className="dashboard-root">
          <Sidebar />
          <main className="dash-main">
            {children}
          </main>
        </div>
      </SessionProvider>
    </QueryProvider>
  )
}
