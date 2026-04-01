import Link from "next/link"
import { MessageSquare, Terminal, Shield, Zap } from "lucide-react"

export function ChatbotSection() {
  return (
    <section className="px-4 py-16 md:py-24" id="chatbot">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D838CB]/30 bg-[#D838CB]/10">
              <MessageSquare size={14} className="text-[#D838CB]" />
              <span className="text-sm font-medium text-[#D838CB]">AI Assistant</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your Intelligent Infrastructure Partner
            </h2>
            <p className="text-lg text-[#888888] mb-6 leading-relaxed">
              Meet your new AI-powered troubleshooting companion. Our intelligent assistant helps you diagnose issues, 
              explain complex errors in plain English, and provides actionable recommendations. Whether you're debugging 
              a failing pipeline, investigating latency spikes, or just need to understand your system's health — 
              simply ask and get instant, context-aware responses.
            </p>
            <ul className="space-y-3 text-[#aaaaaa]">
              <li className="flex items-center gap-3">
                <Zap size={18} className="text-[#D838CB]" />
                <span>Instant answers to complex infrastructure questions</span>
              </li>
              <li className="flex items-center gap-3">
                <Terminal size={18} className="text-[#D838CB]" />
                <span>Natural language interface — no CLI expertise required</span>
              </li>
              <li className="flex items-center gap-3">
                <Shield size={18} className="text-[#D838CB]" />
                <span>Context-aware suggestions based on your specific setup</span>
              </li>
            </ul>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect fill='%23111111' width='400' height='300' rx='12'/%3E%3Crect fill='%231a1a1a' x='20' y='20' width='360' height='200' rx='8'/%3E%3Ccircle fill='%23D838CB' cx='40' cy='40' r='12'/%3E%3Crect fill='%23222222' x='60' y='32' width='200' height='16' rx='4'/%3E%3Crect fill='%23151515' x='20' y='70' width='260' height='24' rx='4'/%3E%3Crect fill='%23151515' x='20' y='100' width='300' height='24' rx='4'/%3E%3Crect fill='%23151515' x='20' y='130' width='240' height='24' rx='4'/%3E%3Crect fill='%23D838CB' x='20' y='240' width='80' height='32' rx='4'/%3E%3Crect fill='%23222222' x='110' y='240' width='210' height='32' rx='4'/%3E%3Ctext fill='%23ffffff' x='40' y='52' font-family='system-ui' font-size='12' font-weight='bold'%3EAI CTO Assistant%3C/text%3E%3Ctext fill='%23888888' x='40' y='170' font-family='system-ui' font-size='14'%3EHow's the auth service doing?%3C/text%3E%3Ctext fill='%23D838CB' x='40' y='210' font-family='system-ui' font-size='14'%3EResponse: Healthy. All checks passing.%3C/text%3E%3C/svg%3E" 
                alt="AI Chatbot Interface"
                style={{ 
                  borderRadius: '12px', 
                  border: '2px solid #D838CB',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
