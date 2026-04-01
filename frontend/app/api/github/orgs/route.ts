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

    const githubAccessToken = session.user.accessToken

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
      organizations: orgs.map((org: any) => ({
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
