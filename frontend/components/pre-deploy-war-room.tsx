import { ShieldAlert, CheckCircle } from "lucide-react"

export function PreDeployWarRoom() {
  return (
    <section className="w-full py-16 md:py-24" id="war-room">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="w-full">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/10">
              <ShieldAlert size={14} className="text-[#0ea5e9]" />
              <span className="text-sm font-medium text-[#0ea5e9]">Pre-Deploy War Room</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pre-Deploy War Room
            </h2>
            <p className="text-lg text-[#888888] mb-8 leading-relaxed">
              Before any deployment, the system automatically opens a collaborative war room, aggregates signals from monitoring, tests, and logs, and gives the team a clear go/no-go recommendation.
            </p>
            <ul className="space-y-4 text-[#aaaaaa]">
              <li className="flex items-start gap-3">
                <CheckCircle size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Aggregates signals from all monitoring tools</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Real-time go/no-go decision engine</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Collaborative review with your team</span>
              </li>
            </ul>
          </div>
          <div className="w-full">
            <div className="flex justify-center lg:justify-end w-full">
              <div className="w-full max-w-md">
                <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                  <div className="bg-[#0f0f0f] px-4 py-3 border-b border-[#222222] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">War Room: auth-service</span>
                      <span className="text-[#666666] text-xs">#4821</span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">GO</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#111111] border border-[#222222]">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      <span className="text-white text-sm">All tests passing</span>
                      <span className="text-green-400 text-xs ml-auto">✓</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#111111] border border-[#222222]">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      <span className="text-white text-sm">No open P0 incidents</span>
                      <span className="text-green-400 text-xs ml-auto">✓</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#111111] border border-[#222222]">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      <span className="text-white text-sm">Latency normal</span>
                      <span className="text-green-400 text-xs ml-auto">✓</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#111111] border border-[#222222]">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                      <span className="text-white text-sm">Config drift detected</span>
                      <span className="text-yellow-400 text-xs ml-auto">⚠</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-[#222222] flex items-center justify-between bg-[#0a0a0a]">
                    <span className="text-[#666666] text-xs">3 signals reviewed</span>
                    <span className="text-[#0ea5e9] text-xs font-medium">View Details →</span>
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