"use client"

import { useState } from "react"
import { MessageSquare, X, Send } from "lucide-react"

const defaultMessages = [
  { from: "ai", text: "Hi! I'm your AI DevOps assistant. How can I help you today?" },
]

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(defaultMessages)
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg = { from: "user", text: input }
    setMessages([...messages, userMsg])
    setInput("")

    setTimeout(() => {
      const responses = [
        "I can help you with that! Let me check your pipeline status.",
        "That sounds like a configuration issue. Would you like me to analyze your logs?",
        "Great question! I recommend checking your environment variables.",
        "I've analyzed your infrastructure. Everything looks healthy.",
      ]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      setMessages((prev) => [...prev, { from: "ai", text: randomResponse }])
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
        className="w-14 h-14 rounded-full bg-[#D838CB] flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
        style={{ boxShadow: "0 4px 20px rgba(216,56,203,0.4)" }}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <MessageSquare size={24} className="text-white" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute bottom-20 right-0 w-80 bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden"
          style={{
            opacity: 1,
            transform: "translateY(0)",
            transition: "transform 0.3s ease, opacity 0.3s ease",
          }}
        >
          <div className="bg-[#1a1a1a] px-4 py-3 border-b border-[#222222] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D838CB]" />
            <span className="text-white font-medium text-sm">AI Assistant</span>
          </div>

          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                    msg.from === "user"
                      ? "bg-[#D838CB] text-white"
                      : "bg-[#1a1a1a] text-[#cccccc] border border-[#333333]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-[#222222] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question..."
              className="flex-1 bg-[#1a1a1a] border border-[#333333] rounded-full px-4 py-2 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#D838CB]"
            />
            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full bg-[#D838CB] flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
