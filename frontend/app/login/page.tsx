import { redirect } from "next/navigation"
import { GitHubAuthGate } from "@/components/auth/GitHubAuthGate"
import { getSession } from "@/lib/auth-session"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await getSession()
  const { callbackUrl } = await searchParams
  const target = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard"

  if (session) {
    redirect(target)
  }

  return (
    <GitHubAuthGate
      callbackURL={target}
      title="Sign in to DevOps Autopilot"
      description="Authenticate with GitHub first. After Better Auth confirms your session, we will take you straight into the dashboard."
    />
  )
}
