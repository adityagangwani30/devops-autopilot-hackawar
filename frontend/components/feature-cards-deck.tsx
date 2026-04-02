import { 
  Zap, 
  CheckCircle, 
  ShieldAlert, 
  DollarSign, 
  MessageSquare,
  AlertTriangle,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    number: "01",
    icon: Zap,
    title: "Instant Diagnosis",
    description: "When your pipeline fails, the agent identifies the root cause immediately — no more digging through logs at 3 AM.",
  },
  {
    number: "02",
    icon: CheckCircle,
    title: "Fix with Approval",
    description: "The agent proposes a fix, shows you the diff, and waits for your approval before applying. You stay in control.",
  },
  {
    number: "03",
    icon: ShieldAlert,
    title: "Risk Detection",
    description: "If a deploy is too risky — high blast radius, failing tests, or config drift — the agent flags it and explains why.",
  },
  {
    number: "04",
    icon: DollarSign,
    title: "Cost Tracking",
    description: "See the real-time value of SLA penalties avoided and downtime prevented. Your ROI, quantified live.",
  },
  {
    number: "05",
    icon: MessageSquare,
    title: "Natural Language Queries",
    description: "Ask questions like &quot;Why did the auth service fail?&quot; and get clear answers — not a wall of YAML.",
  },
]

export function FeatureCardsDeck() {
  return (
    <section id="features" className="w-full py-16 md:py-24 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Built for{" "}
            <span className="text-[#0ea5e9]">real-world DevOps</span>
          </h2>
          <p className="text-lg text-[#888888] max-w-2xl mx-auto">
            Five core capabilities that make DevOps Autopilot your most reliable team member.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-[#111111] border border-[#222222] rounded-2xl p-8 hover:border-[#0ea5e9] transition-colors"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-mono font-bold text-[#555555] tracking-wider">
                  {feature.number}
                </span>
                <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                  <feature.icon size={22} className="text-[#0ea5e9]" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-[#888888]">
                {feature.description}
              </p>
            </div>
          ))}

          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 flex flex-col items-center justify-center text-center border-dashed">
            <div className="w-14 h-14 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
              <ArrowRight size={24} className="text-[#0ea5e9]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">See it in action</h3>
            <p className="text-[#888888] mb-6">
              Explore the live Command Center dashboard.
            </p>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#0ea5e9] text-white hover:scale-[1.03] transition-transform"
            >
              Launch Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}