"use client"

import { 
  Zap, 
  CheckCircle, 
  ShieldAlert, 
  DollarSign, 
  MessageSquare,
  AlertTriangle,
  Eye,
  Brain,
  Cog,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    number: "01",
    icon: Zap,
    title: "Instant Diagnosis",
    description:
      "When your CI/CD pipeline fails, the agent instantly identifies the root cause — no more digging through 200 lines of build logs at 3 AM.",
    gradient: "from-cyan-400 to-teal-500",
    glowColor: "rgba(45, 212, 191, 0.15)",
  },
  {
    number: "02",
    icon: CheckCircle,
    title: "Fix + Approve Flow",
    description:
      "The agent proposes a concrete fix, shows you the diff, and waits for your one-click approval before applying. You stay in control.",
    gradient: "from-emerald-400 to-green-500",
    glowColor: "rgba(52, 211, 153, 0.15)",
  },
  {
    number: "03",
    icon: ShieldAlert,
    title: "Pushback",
    description:
      "If a deploy is too risky — high blast radius, failing tests, or config drift — the agent pushes back and explains exactly why.",
    gradient: "from-amber-400 to-orange-500",
    glowColor: "rgba(251, 146, 60, 0.15)",
  },
  {
    number: "04",
    icon: DollarSign,
    title: "Live Cost Counter",
    description:
      "See the real-time dollar value of SLA penalties avoided and downtime prevented. Your ROI, quantified live on the dashboard.",
    gradient: "from-violet-400 to-purple-500",
    glowColor: "rgba(167, 139, 250, 0.15)",
  },
  {
    number: "05",
    icon: MessageSquare,
    title: "Natural Language Chat",
    description:
      'Talk to your infrastructure in plain English. Ask "Why did the auth service fail?" and get an actionable answer — not a wall of YAML.',
    gradient: "from-blue-400 to-indigo-500",
    glowColor: "rgba(96, 165, 250, 0.15)",
  },
]

export function DashboardShowcase() {
  return (
    <section className="relative px-4 py-8 md:py-16">
      <div className="max-w-6xl mx-auto">

        {/* ═══════════════════════════════════════
            THE PROBLEM
           ═══════════════════════════════════════ */}
        <div id="problem" className="mb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 mb-4">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-red-400 text-sm font-medium">The Problem</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              Your pipeline broke.{" "}
              <span className="text-red-400">Now what?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="liquid-glass-card rounded-2xl p-8 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Eye size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Monitoring surfaces failures <span className="text-red-400">after</span> they hit production
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Traditional monitoring tools alert you when things are already broken. By the time you see the Slack notification, your users have already seen the error page. You&apos;re always reactive, never proactive.
              </p>
            </div>

            <div className="liquid-glass-card rounded-2xl p-8 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <DollarSign size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                A <span className="text-amber-400">$400K+/year CTO</span> is out of reach for most startups
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                You need someone who understands blast radius, can read Terraform diffs, and knows when to say &quot;don&apos;t deploy on Friday at 5 PM.&quot; That expertise costs half a million — or one AI agent.
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            THE SOLUTION
           ═══════════════════════════════════════ */}
        <div id="solution" className="mb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 mb-4">
              <Cog size={14} className="text-teal-400 animate-spin" style={{ animationDuration: "3s" }} />
              <span className="text-teal-400 text-sm font-medium">The Solution</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              The Core Loop:{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Observe → Reason → Act
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              An intelligent agent that watches your pipeline 24/7, understands context like a senior engineer, and takes action — with your permission.
            </p>
          </div>

          {/* Core Loop Visual */}
          <div className="max-w-5xl mx-auto">
            <div className="glass-panel rounded-3xl p-6 md:p-10">
              {/* Desktop: 5-col grid  |  Mobile: vertical stack */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 md:gap-6 items-start">
                {/* Observe */}
                <div className="text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                    <Eye size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Observe</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Continuously monitors CI/CD events, git commits, deploy triggers, and infrastructure metrics in real-time.
                  </p>
                </div>

                {/* Arrow 1 */}
                <div className="hidden md:flex items-center justify-center pt-5">
                  <ArrowRight size={32} className="text-teal-400/60" />
                </div>
                <div className="md:hidden flex justify-center py-1">
                  <ArrowRight size={24} className="text-teal-400/60 rotate-90" />
                </div>

                {/* Reason */}
                <div className="text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(45,212,191,0.2)]">
                    <Brain size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Reason</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Analyzes blast radius, evaluates risk scores, cross-references past failures, and decides the best course of action.
                  </p>
                </div>

                {/* Arrow 2 */}
                <div className="hidden md:flex items-center justify-center pt-5">
                  <ArrowRight size={32} className="text-teal-400/60" />
                </div>
                <div className="md:hidden flex justify-center py-1">
                  <ArrowRight size={24} className="text-teal-400/60 rotate-90" />
                </div>

                {/* Act */}
                <div className="text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                    <Zap size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Act</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Proposes fixes, pushes back on risky deploys, or auto-remediates — always with human-in-the-loop approval.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            FEATURES GRID
           ═══════════════════════════════════════ */}
        <div id="features" className="scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
              Built for{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                real-world DevOps
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Five core capabilities that make DevOps Autopilot your most reliable team member.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <div
                key={index}
                className="liquid-glass-card rounded-2xl p-7 group relative overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${feature.glowColor}, transparent 70%)` }}
                />

                <div className="relative">
                  {/* Number + Icon */}
                  <div className="flex items-center gap-4 mb-5">
                    <span className="text-xs font-mono font-bold text-muted-foreground/50 tracking-wider">
                      {feature.number}
                    </span>
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon size={22} className="text-white" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}

            {/* CTA Card */}
            <div className="liquid-glass-card rounded-2xl p-7 flex flex-col items-center justify-center text-center group border-dashed">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <ArrowRight size={24} className="text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">See it in action</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Explore the live Command Center dashboard.
              </p>
              <Link
                href="/dashboard"
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-[#060B18] bg-gradient-to-r from-teal-400 to-cyan-400 shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] hover:scale-[1.03] transition-all duration-300"
              >
                Launch Dashboard →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
