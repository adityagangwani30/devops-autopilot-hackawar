"use client"

import { useState } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const quickActions = [
  "Show me recent deployments",
  "What issues need attention?",
  "Create a new pipeline",
  "Check system health",
  "Explain this error",
  "Generate deployment report",
]

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your DevOps Autopilot AI assistant. I can help you with deployments, pipeline management, troubleshooting, and more. How can I assist you today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I've analyzed your request. Based on the current system state, here's what I found: Your deployment pipeline is running smoothly with a 94.2% success rate. There are 3 open issues across your repositories that may need attention.",
        timestamp: new Date()
      }])
    }, 1500)
  }

  const handleQuickAction = (action: string) => {
    setInput(action)
  }

  return (
    <>
      <div className="dash-topbar">
        <div className="topbar-left">
          <h2>AI Chatbot</h2>
          <p>Get instant help from your AI DevOps assistant</p>
        </div>
        <div className="topbar-right">
          <button className="topbar-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Chat History
          </button>
          <button className="topbar-btn primary">
            + New Chat
          </button>
        </div>
      </div>

      <div className="dash-content" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", paddingBottom: "120px" }}>
        <div className="dash-card dash-animate-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
          <div className="dash-card-header" style={{ borderBottom: "1px solid var(--border)", padding: "16px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="ai-avatar" style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, var(--accent), var(--cyan))", display: "grid", placeItems: "center", fontSize: "14px", boxShadow: "0 0 16px var(--accent-glow)" }}>
                🤖
              </div>
              <div>
                <p style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text-primary)" }}>DevOps Autopilot AI</p>
                <p style={{ fontSize: ".62rem", color: "var(--green)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
                  Online
                </p>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="chat-msg"
                style={{ flexDirection: msg.role === "user" ? "row-reverse" : "row" }}
              >
                {msg.role === "assistant" ? (
                  <div className="ai-avatar" style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, var(--accent), var(--cyan))", display: "grid", placeItems: "center", fontSize: "12px", flexShrink: 0 }}>
                    🤖
                  </div>
                ) : (
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, var(--purple), var(--orange))", display: "grid", placeItems: "center", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>
                    U
                  </div>
                )}
                <div
                  className="msg-bubble"
                  style={{
                    background: msg.role === "user" ? "var(--accent-dim)" : "var(--bg-surface)",
                    border: msg.role === "user" ? "1px solid var(--border-glow)" : "1px solid var(--border)",
                    borderRadius: msg.role === "user" ? "10px 10px 4px 10px" : "10px 10px 10px 4px",
                    maxWidth: "70%"
                  }}
                >
                  <p style={{ fontSize: ".82rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>{msg.content}</p>
                  <p className="msg-time">{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="chat-msg">
                <div className="ai-avatar" style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, var(--accent), var(--cyan))", display: "grid", placeItems: "center", fontSize: "12px", flexShrink: 0 }}>
                  🤖
                </div>
                <div className="msg-bubble">
                  <div style={{ display: "flex", gap: "4px", padding: "4px 0" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", animation: "dash-pulse-dot 1s ease-in-out infinite" }} />
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", animation: "dash-pulse-dot 1s ease-in-out 0.2s infinite" }} />
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", animation: "dash-pulse-dot 1s ease-in-out 0.4s infinite" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "16px 22px", borderTop: "1px solid var(--border)", background: "var(--bg-deep)" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Ask me anything about your DevOps pipeline..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontSize: ".82rem",
                  outline: "none"
                }}
              />
              <button
                onClick={handleSend}
                className="topbar-btn primary"
                style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="dash-card dash-animate-in dash-delay-1">
            <div className="dash-card-header">
              <p className="dash-card-title">Quick Actions</p>
            </div>
            <div className="dash-card-body" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action)}
                  style={{
                    padding: "12px 14px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: ".78rem",
                    color: "var(--text-secondary)",
                    transition: "all .25s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-glow)"
                    e.currentTarget.style.background = "var(--accent-dim)"
                    e.currentTarget.style.color = "var(--text-primary)"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)"
                    e.currentTarget.style.background = "var(--bg-surface)"
                    e.currentTarget.style.color = "var(--text-secondary)"
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="dash-card dash-animate-in dash-delay-2">
            <div className="dash-card-header">
              <p className="dash-card-title">Capabilities</p>
            </div>
            <div className="dash-card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { icon: "🚀", title: "Deployments", desc: "Monitor & troubleshoot" },
                  { icon: "🔧", title: "Pipeline Mgmt", desc: "Create & optimize CI/CD" },
                  { icon: "🐛", title: "Issue Analysis", desc: "Root cause analysis" },
                  { icon: "📊", title: "Reports", desc: "Generate insights" },
                ].map((cap) => (
                  <div key={cap.title} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "1.2rem" }}>{cap.icon}</span>
                    <div>
                      <p style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--text-primary)" }}>{cap.title}</p>
                      <p style={{ fontSize: ".65rem", color: "var(--text-muted)" }}>{cap.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dash-card dash-animate-in dash-delay-3">
            <div className="dash-card-header">
              <p className="dash-card-title">Session Stats</p>
            </div>
            <div className="dash-card-body">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>Messages</span>
                <span style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-mono)" }}>{messages.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>Response Time</span>
                <span style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--green)", fontFamily: "var(--font-mono)" }}>1.2s avg</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>Model</span>
                <span style={{ fontSize: ".72rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>GPT-4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
