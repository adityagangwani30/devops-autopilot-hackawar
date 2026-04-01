"use client"

import { useState } from "react"
import { MessageSquare, X, Send } from "lucide-react"

const defaultMessages = [
  { from: "ai", text: "Hi! I'm your AI DevOps assistant. How can I help you today?" },
]

const staticResponses = [
  "I can help you with that! Let me check your pipeline status.",
  "That sounds like a configuration issue. Would you like me to analyze your logs?",
  "Great question! I recommend checking your environment variables.",
  "I've analyzed your infrastructure. Everything looks healthy.",
]

function getResponse(index: number): string {
  return staticResponses[index % staticResponses.length]
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(defaultMessages)
  const [input, setInput] = useState("")
  const [responseIndex, setResponseIndex] = useState(0)

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg = { from: "user", text: input }
    setMessages([...messages, userMsg])
    setInput("")

    setTimeout(() => {
      const aiMsg = { from: "ai", text: getResponse(responseIndex) }
      setMessages((prev) => [...prev, aiMsg])
      setResponseIndex((prev) => prev + 1)
    }, 800)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend()
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-[#1a1a1a] text-[#888888] text-sm px-3 py-1.5 rounded-full border border-[#333333]">
            Need help? Ask AI
          </span>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[#0ea5e9] flex items-center justify-center hover:scale-105 transition-transform chatbot-toggle-btn"
        suppressHydrationWarning
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <MessageSquare size={24} className="text-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 bg-[#111111] border border-[#222222] rounded-xl overflow-hidden chatbot-panel">
          <div className="bg-[#1f2937] px-4 py-3 border-b border-[#374151] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
            <span className="text-white font-medium text-sm">AI Assistant</span>
            <span className="text-xs text-green-500 ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Online
            </span>
          </div>

          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-sm ${
                    msg.from === "user"
                      ? "bg-[#0ea5e9] text-white rounded-2xl rounded-br-sm"
                      : "bg-[#1f2937] text-[#d1d5db] border border-[#374151] rounded-2xl rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#222222] flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              className="flex-1 bg-[#1f2937] border border-[#374151] rounded-full px-4 py-2.5 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#0ea5e9] chatbot-input"
              suppressHydrationWarning
            />
            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full bg-[#0ea5e9] flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0"
              suppressHydrationWarning
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
