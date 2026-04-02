import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getDashboardInsights } from "@/lib/server/dashboard-insights"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const insights = await getDashboardInsights(session.user.id)
    return NextResponse.json(insights)
  } catch (error) {
    console.error("Error fetching dashboard insights:", error)
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Failed to fetch dashboard insights",
      },
      { status: 500 },
    )
  }
}
