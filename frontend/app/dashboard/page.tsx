"use client"

import { useSession } from "@/lib/use-session"
import { useEffect, useState } from "react"

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

export default function DashboardPage() {
  const { session, loading, signOut } = useSession()
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">DA</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground">DevOps Autopilot</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="text-sm text-foreground">{session.user.name}</span>
            </div>
            <button
              onClick={signOut}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Connect your GitHub organization to get started
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Connected Organizations</h3>
              <button
                onClick={fetchGitHubOrgs}
                disabled={loadingOrgs}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loadingOrgs ? "Loading..." : "Connect GitHub Org"}
              </button>
            </div>

            {connectedOrgs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <p>No organizations connected yet</p>
                <p className="text-sm mt-1">Connect a GitHub organization to begin</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connectedOrgs.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      {org.githubOrgAvatar && (
                        <img
                          src={org.githubOrgAvatar}
                          alt={org.name}
                          className="h-10 w-10 rounded-lg"
                        />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{org.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Connected {new Date(org.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => disconnectOrg(org.id)}
                      className="px-3 py-1.5 text-sm text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-accent/50 rounded-lg border border-border">
                <p className="text-2xl font-bold text-primary">{connectedOrgs.length}</p>
                <p className="text-sm text-muted-foreground">Connected Orgs</p>
              </div>
              <div className="p-4 bg-accent/50 rounded-lg border border-border">
                <p className="text-2xl font-bold text-emerald-500">0</p>
                <p className="text-sm text-muted-foreground">Active Pipelines</p>
              </div>
              <div className="p-4 bg-accent/50 rounded-lg border border-border">
                <p className="text-2xl font-bold text-amber-500">0</p>
                <p className="text-sm text-muted-foreground">Pending Issues</p>
              </div>
              <div className="p-4 bg-accent/50 rounded-lg border border-border">
                <p className="text-2xl font-bold text-blue-500">0</p>
                <p className="text-sm text-muted-foreground">Deployments Today</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showOrgPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Select GitHub Organization</h3>
                <button
                  onClick={() => setShowOrgPicker(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {githubOrgs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No organizations found</p>
              ) : (
                <div className="space-y-2">
                  {githubOrgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => connectOrg(org)}
                      disabled={connectingOrg === org.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50 text-left"
                    >
                      <img src={org.avatar_url} alt={org.login} className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{org.login}</p>
                        <p className="text-sm text-muted-foreground">{org.url}</p>
                      </div>
                      {connectingOrg === org.id && (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
