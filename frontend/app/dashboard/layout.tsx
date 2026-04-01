"use client"

import { useSession } from "@/lib/use-session"
import Sidebar from "@/components/dashboard/Sidebar"
import "../dashboard/dashboard.css"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session, loading } = useSession()

  if (loading) {
    return (
      <div className="dashboard-root">
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2DD4BF] border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="dashboard-root">
      <Sidebar />
      <main className="dash-main">
        {children}
      </main>
    </div>
  )
}
