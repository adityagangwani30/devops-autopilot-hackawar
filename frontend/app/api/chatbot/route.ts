import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { getKnowledgeGraphForUser } from "@/lib/server/analysis-store"
import { chatWithAiCto, type AiCtoChatMessage } from "@/lib/server/ai-cto"

function isChatMessage(value: unknown): value is AiCtoChatMessage {
  if (!value || typeof value !== "object") {
    return false
  }

  const message = value as Record<string, unknown>
  return (
    (message.role === "user" || message.role === "assistant" || message.role === "system") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  )
}

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const messages = Array.isArray(body?.messages)
      ? body.messages.filter(isChatMessage)
      : []

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "At least one chat message is required" },
        { status: 400 },
      )
    }

    const knowledgeGraph = await getKnowledgeGraphForUser(session.user.id)
    const result = await chatWithAiCto(
      messages,
      knowledgeGraph,
      "You are DevOps Autopilot AI. Answer clearly, keep suggestions actionable, and be transparent when the knowledge graph does not contain enough evidence.",
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in chatbot route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Failed to process chatbot request",
      },
      { status: 500 },
    )
  }
}
