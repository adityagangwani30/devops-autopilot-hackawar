import { MessageSquare, Terminal, Shield, Zap } from "lucide-react"

export function ChatbotSection() {
  return (
    <section className="w-full py-16 md:py-24" id="chatbot">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="w-full">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/10">
              <MessageSquare size={14} className="text-[#0ea5e9]" />
              <span className="text-sm font-medium text-[#0ea5e9]">AI Assistant</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              AI Assistant
            </h2>
            <p className="text-lg text-[#888888] mb-8 leading-relaxed">
              Get instant answers to infrastructure questions. Our AI understands your setup, explains issues in plain language, and recommends next steps.
            </p>
            <ul className="space-y-4 text-[#aaaaaa]">
              <li className="flex items-start gap-3">
                <Zap size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Instant answers to infrastructure questions</span>
              </li>
              <li className="flex items-start gap-3">
                <Terminal size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Simple questions, no CLI knowledge needed</span>
              </li>
              <li className="flex items-start gap-3">
                <Shield size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Suggestions tailored to your setup</span>
              </li>
            </ul>
          </div>
          <div className="flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-md">
              <div className="rounded-2xl border-2 border-[#0ea5e9] bg-[#111111] overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(14, 165, 233, 0.15)' }}>
                <div className="bg-[#1a1a1a] px-4 py-3 rounded-t-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0ea5e9] flex items-center justify-center">
                    <MessageSquare size={14} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">AI Assistant</div>
                    <div className="text-gray-500 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Online now
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-[#1f2937] text-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm max-w-[85%] text-sm">
                      How&apos;s the auth service doing?
                      <div className="text-gray-500 text-xs mt-1">10:15 AM</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="bg-[#0ea5e9] text-white px-4 py-3 rounded-2xl rounded-br-sm max-w-[85%] text-sm">
                      Response: Healthy. All checks passing.
                      <div className="text-blue-200 text-xs mt-1">10:16 AM</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 border-t border-[#222222]">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Ask about system health..." 
                      className="flex-1 bg-[#1a1a1a] border border-[#333333] rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0ea5e9]"
                      suppressHydrationWarning
                    />
                    <button className="w-10 h-10 rounded-full bg-[#0ea5e9] flex items-center justify-center flex-shrink-0" suppressHydrationWarning>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
