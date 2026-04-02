"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

interface ChatToolResult {
  question: string
  summary: string
  stats: {
    analyzedRepositories: number
    failedRepositories: number
    graphNodes: number
    graphEdges: number
  }
  repositories: Array<{
    repoFullName: string
    repoName: string
    status: string
    summary: string
    analyzedAt: string
    lastError: string
    score: number
  }>
  matchingNodes: Array<{
    label: string
    type: string
    repoFullName: string
    score: number
  }>
  ciIssues: Array<{
    repoFullName: string
    summary: string
    score: number
  }>
  suggestions: Array<{
    repoFullName: string
    summary: string
    score: number
  }>
  topLanguages: Array<{
    language: string
    bytes: number
  }>
  recommendedActions: string[]
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  toolResult?: ChatToolResult | null
  fallback?: boolean
}

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Ask about your repositories, workflows, CI issues, or saved knowledge graph. I will ground the answer in your local AI CTO analysis whenever that data exists.",
    timestamp: new Date().toISOString(),
  },
]

const quickActions = [
  "Summarize my knowledge graph",
  "Which repositories need attention first?",
  "What CI issues are currently saved?",
  "What are the top recommendations across my repos?",
  "Which workflows look weak or missing?",
  "What should I do next to improve delivery health?",
]

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestToolResult, setLatestToolResult] = useState<ChatToolResult | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isSending])

  const sessionStats = useMemo(() => {
    const assistantMessages = messages.filter((message) => message.role === "assistant").length
    return {
      totalMessages: messages.length,
      assistantMessages,
    }
  }, [messages])

  const resetChat = () => {
    setMessages(initialMessages)
    setInput("")
    setError(null)
    setLatestToolResult(null)
  }

  const sendMessage = async (presetMessage?: string) => {
    const content = (presetMessage ?? input).trim()
    if (!content || isSending) {
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    const conversation = [...messages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }))

    setMessages((current) => [...current, userMessage])
    setInput("")
    setIsSending(true)
    setError(null)

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversation,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to get a chatbot response")
      }

      const toolResult = (data.tool_result || null) as ChatToolResult | null
      setLatestToolResult(toolResult)
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: typeof data.message === "string"
            ? data.message
            : "I could not generate a response.",
          timestamp: new Date().toISOString(),
          toolResult,
          fallback: Boolean(data.fallback),
        },
      ])
    } catch (sendError) {
      const message = sendError instanceof Error
        ? sendError.message
        : "Failed to reach the chatbot service"

      setError(message)
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "I could not complete that request right now. Please check the AI CTO service or try again in a moment.",
          timestamp: new Date().toISOString(),
          fallback: true,
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div style={{ height: '100vh' }}>
      <div
        className="dash-card dash-animate-in"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div
          className="dash-card-header"
          style={{
            borderBottom: "1px solid var(--border)",
            paddingBottom: "16px",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              className="ai-avatar"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, var(--accent), var(--cyan))",
                display: "grid",
                placeItems: "center",
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--bg-deepest)",
              }}
            >
              AI
            </div>
            <div>
              <p style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                DevOps Autopilot AI
              </p>
              <p style={{ fontSize: ".64rem", color: "var(--text-muted)" }}>
                Knowledge graph grounded chat
              </p>
            </div>
          </div>
          <span className="dash-card-badge">AI CTO</span>
        </div>

        {error ? (
          <div
            style={{
              margin: "16px 22px 0",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(248,113,113,.08)",
              border: "1px solid rgba(248,113,113,.2)",
              color: "var(--red)",
              fontSize: ".76rem",
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className="chat-msg"
              style={{ flexDirection: message.role === "user" ? "row-reverse" : "row" }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: message.role === "assistant"
                    ? "linear-gradient(135deg, var(--accent), var(--cyan))"
                    : "linear-gradient(135deg, var(--purple), var(--orange))",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: message.role === "assistant" ? "var(--bg-deepest)" : "var(--text-primary)",
                  flexShrink: 0,
                }}
              >
                {message.role === "assistant" ? "AI" : "U"}
              </div>

              <div
                className="msg-bubble"
                style={{
                  background: message.role === "user" ? "var(--accent-dim)" : "var(--bg-surface)",
                  border: message.role === "user"
                    ? "1px solid var(--border-glow)"
                    : "1px solid var(--border)",
                  borderRadius: message.role === "user"
                    ? "10px 10px 4px 10px"
                    : "10px 10px 10px 4px",
                  maxWidth: "78%",
                }}
              >
                <div
                  style={{
                    fontSize: ".8rem",
                    lineHeight: 1.65,
                    color: "var(--text-secondary)",
                  }}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p style={{ margin: "0 0 8px 0" }}>{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul style={{ margin: "0 0 8px 16px", padding: 0 }}>{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol style={{ margin: "0 0 8px 16px", padding: 0 }}>{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li style={{ margin: "2px 0" }}>{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{children}</strong>
                      ),
                      em: ({ children }) => (
                        <em style={{ fontStyle: "italic" }}>{children}</em>
                      ),
                      code: ({ className, children }) => {
                        const isInline = !className
                        if (isInline) {
                          return (
                            <code
                              style={{
                                background: "var(--bg-deep)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: ".85em",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {children}
                            </code>
                          )
                        }
                        return (
                          <code
                            className={className}
                            style={{
                              display: "block",
                              background: "var(--bg-deep)",
                              padding: "12px 14px",
                              borderRadius: "8px",
                              fontSize: ".78rem",
                              fontFamily: "var(--font-mono)",
                              overflow: "auto",
                              margin: "8px 0",
                            }}
                          >
                            {children}
                          </code>
                        )
                      },
                      pre: ({ children }) => <>{children}</>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--cyan)", textDecoration: "underline" }}
                        >
                          {children}
                        </a>
                      ),
                      h1: ({ children }) => (
                        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", margin: "16px 0 8px 0" }}>{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", margin: "14px 0 6px 0" }}>{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: "12px 0 4px 0" }}>{children}</h3>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote
                          style={{
                            borderLeft: "3px solid var(--accent)",
                            margin: "8px 0",
                            paddingLeft: "12px",
                            color: "var(--text-muted)",
                            fontStyle: "italic",
                          }}
                        >
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {message.toolResult ? (
                  <div
                    style={{
                      marginTop: "12px",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span className="dash-card-badge">
                      {message.toolResult.stats.analyzedRepositories} repos
                    </span>
                    <span className="dash-card-badge">
                      {message.toolResult.stats.graphNodes} nodes
                    </span>
                    <span className="dash-card-badge">
                      {message.toolResult.stats.graphEdges} edges
                    </span>
                  </div>
                ) : null}

                <div
                  style={{
                    marginTop: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <p className="msg-time">{formatTime(message.timestamp)}</p>
                  {message.fallback ? (
                    <span className="tag observe">fallback</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}

          {isSending ? (
            <div className="chat-msg">
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, var(--accent), var(--cyan))",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--bg-deepest)",
                  flexShrink: 0,
                }}
              >
                AI
              </div>
              <div className="msg-bubble">
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", animation: "dash-pulse-dot 1s ease-in-out infinite" }} />
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", animation: "dash-pulse-dot 1s ease-in-out .2s infinite" }} />
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", animation: "dash-pulse-dot 1s ease-in-out .4s infinite" }} />
                </div>
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        <div
          style={{
            padding: "16px 22px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-deep)",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Ask about repositories, issues, workflows, or the knowledge graph"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void sendMessage()
                }
              }}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                fontSize: ".82rem",
                outline: "none",
              }}
            />
            <button
              onClick={() => void sendMessage()}
              className="topbar-btn primary"
              disabled={isSending}
              style={{ padding: "12px 18px" }}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
