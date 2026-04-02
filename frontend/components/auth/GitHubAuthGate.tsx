"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { authClient } from "@/lib/auth-client"

const previews = [
  {
    title: "Repositories",
    description: "Browse connected GitHub repositories and inspect delivery health.",
    accent: "#2dd4bf",
  },
  {
    title: "Knowledge Graph",
    description: "Map relationships between repos, services, pipelines, and deploys.",
    accent: "#38bdf8",
  },
]

export function GitHubAuthGate({
  callbackURL,
  title = "Authenticate with GitHub",
  description = "Sign in with Better Auth before entering the dashboard.",
}: {
  callbackURL?: string
  title?: string
  description?: string
}) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const target = callbackURL && callbackURL.startsWith("/")
    ? callbackURL
    : pathname.startsWith("/dashboard")
      ? pathname
      : "/dashboard"

  const handleGitHubLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: target,
      })
    } catch (authError) {
      console.error("GitHub login failed:", authError)
      setError("GitHub authentication failed. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080c10] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-12 px-6 py-16 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#7dd3fc]">
            Better Auth protected
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 md:text-lg">
            {description}
          </p>
        </div>

        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#0d141d] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[#2dd4bf]">
            Step 1
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            Continue with GitHub
          </h2>
          <p className="mt-2 text-sm text-white/65">
            Connect your GitHub identity first. Once Better Auth confirms your session,
            you will move into the dashboard automatically.
          </p>

          <button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#111c28] px-5 py-4 text-sm font-semibold text-white transition hover:border-[#2dd4bf]/50 hover:bg-[#132232] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2dd4bf] border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577V20.58c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.53 11.53 0 0112 5.8c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.565 21.798 24 17.301 24 12 24 5.373 18.627 0 12 0Z" />
              </svg>
            )}
            {isLoading ? "Connecting to GitHub..." : "Authenticate with GitHub"}
          </button>

          {error ? (
            <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
