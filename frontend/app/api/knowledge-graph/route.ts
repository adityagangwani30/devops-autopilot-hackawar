import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getKnowledgeGraphForUser } from "@/lib/server/analysis-store"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const graph = await getKnowledgeGraphForUser(session.user.id)
    return NextResponse.json(graph)
  } catch (error) {
    console.error("Error fetching knowledge graph:", error)
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Failed to fetch knowledge graph",
      },
      { status: 500 },
    )
  }
}
