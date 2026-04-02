import { Activity, Cpu, HardDrive, Network, Gauge, CheckCircle } from "lucide-react"

export function RealTimeMetrics() {
  return (
    <section className="w-full py-16 md:py-24" id="real-time-metrics">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 w-full">
            <div className="flex justify-center lg:justify-start w-full">
              <div className="w-full max-w-sm">
                <img 
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='240' viewBox='0 0 360 240'%3E%3Crect fill='%23111111' width='360' height='240' rx='8'/%3E%3Ctext fill='%23ffffff' x='20' y='30' font-family='system-ui' font-size='12' font-weight='bold'%3EMetrics Dashboard%3C/text%3E%3Crect fill='%231a1a1a' x='16' y='50' width='80' height='60' rx='4'/%3E%3Crect fill='%230ea5e9' x='16' y='80' width='60' height='28' rx='2'/%3E%3Ctext fill='%23888' x='16' y='125' font-family='system-ui' font-size='10'%3ECPU%3C/text%3E%3Crect fill='%231a1a1a' x='108' y='50' width='80' height='60' rx='4'/%3E%3Crect fill='%2322c55e' x='108' y='65' width='65' height='43' rx='2'/%3E%3Ctext fill='%23888' x='108' y='125' font-family='system-ui' font-size='10'%3EMemory%3C/text%3E%3Crect fill='%231a1a1a' x='200' y='50' width='80' height='60' rx='4'/%3E%3Crect fill='%23f59e0b' x='200' y='72' width='55' height='36' rx='2'/%3E%3Ctext fill='%23888' x='200' y='125' font-family='system-ui' font-size='10'%3EDisk%3C/text%3E%3Crect fill='%231a1a1a' x='264' y='50' width='80' height='60' rx='4'/%3E%3Crect fill='%23a855f7' x='264' y='80' width='60' height='28' rx='2'/%3E%3Ctext fill='%23888' x='264' y='125' font-family='system-ui' font-size='10'%3ENetwork%3C/text%3E%3Crect fill='%231a1a1a' x='16' y='140' width='328' height='80' rx='4'/%3E%3Cpath fill='none' stroke='%230ea5e9' stroke-width='2' d='M20 200 L50 180 L80 190 L110 170 L140 185 L170 165 L200 175 L230 160 L260 170 L290 155 L320 165'/%3E%3C/svg%3E"
                  alt="Real-Time Metrics Dashboard"
                  className="w-full h-auto rounded-xl border border-[#0ea5e9]"
                />
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 w-full">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/10">
              <Activity size={14} className="text-[#0ea5e9]" />
              <span className="text-sm font-medium text-[#0ea5e9]">Feature</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Real-Time Metrics & Logging
            </h2>
            <p className="text-lg text-[#888888] mb-8 leading-relaxed">
              Gain complete visibility into your infrastructure with real-time metrics, logs, and traces. Monitor CPU, memory, disk I/O, and network throughput. Visualize your system&apos;s health at a glance and spot issues before they escalate.
            </p>
            <ul className="space-y-4 text-[#aaaaaa]">
              <li className="flex items-start gap-3">
                <Gauge size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Real-time CPU, memory, and disk metrics</span>
              </li>
              <li className="flex items-start gap-3">
                <Network size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Network throughput monitoring</span>
              </li>
              <li className="flex items-start gap-3">
                <HardDrive size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Historical data with trend analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <Cpu size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Custom alerts and thresholds</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}