import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await import("@/lib/db")
    const { account } = await import("@/lib/db/schema")
    const { and, eq } = await import("drizzle-orm")

    const [githubAccount] = await db
      .select({
        accessToken: account.accessToken,
      })
      .from(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, "github")
        )
      )
      .limit(1)

    const githubAccessToken = githubAccount?.accessToken

    if (!githubAccessToken) {
      return NextResponse.json(
        { error: "GitHub access token not available" },
        { status: 400 }
      )
    }

    const response = await fetch("https://api.github.com/user/orgs", {
      headers: {
        Authorization: `Bearer ${githubAccessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch GitHub organizations" },
        { status: response.status }
      )
    }

    const orgs = await response.json()

    return NextResponse.json({
      organizations: orgs.map((org: { id: number; login: string; avatar_url: string; html_url: string }) => ({
        id: org.id.toString(),
        login: org.login,
        avatar_url: org.avatar_url,
        url: org.html_url,
      })),
    })
  } catch (error) {
    console.error("Error fetching GitHub organizations:", error)
    return NextResponse.json(
      { error: "Failed to fetch GitHub organizations" },
      { status: 500 }
    )
  }
}
