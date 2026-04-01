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
  ArrowRight,
  Github,
  Activity
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    number: "01",
    icon: Zap,
    title: "Instant Diagnosis",
    description: "When your CI/CD pipeline fails, the agent instantly identifies the root cause — no more digging through 200 lines of build logs at 3 AM.",
  },
  {
    number: "02",
    icon: CheckCircle,
    title: "Fix + Approve Flow",
    description: "The agent proposes a concrete fix, shows you the diff, and waits for your one-click approval before applying. You stay in control.",
  },
  {
    number: "03",
    icon: ShieldAlert,
    title: "Pushback",
    description: "If a deploy is too risky — high blast radius, failing tests, or config drift — the agent pushes back and explains exactly why.",
  },
  {
    number: "04",
    icon: DollarSign,
    title: "Live Cost Counter",
    description: "See the real-time dollar value of SLA penalties avoided and downtime prevented. Your ROI, quantified live on the dashboard.",
  },
  {
    number: "05",
    icon: MessageSquare,
    title: "Natural Language Chat",
    description: 'Talk to your infrastructure in plain English. Ask "Why did the auth service fail?" and get an actionable answer — not a wall of YAML.',
  },
  {
    number: "06",
    icon: Github,
    title: "GitHub Integration",
    description: "Seamless repository syncing. Track commits, branches, and PRs in real-time. Get alerts on code changes that impact your infrastructure.",
  },
  {
    number: "07",
    icon: Activity,
    title: "Observability",
    description: "Real-time metrics and logging. Monitor CPU, memory, disk I/O, and network throughput. Visualize your system's health at a glance.",
  },
]

export function DashboardShowcase() {
  return (
    <section className="relative px-4 py-8 md:py-16">
      <div className="max-w-6xl mx-auto">

        {/* THE PROBLEM */}
        <div id="problem" className="mb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 mb-4">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-red-500 text-sm font-medium">The Problem</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Your pipeline broke.{" "}
              <span className="text-red-500">Now what?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center mb-5">
                <Eye size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Monitoring surfaces failures <span className="text-red-500">after</span> they hit production
              </h3>
              <p className="text-[#888888] leading-relaxed">
                Traditional monitoring tools alert you when things are already broken. By the time you see the Slack notification, your users have already seen the error page. You&apos;re always reactive, never proactive.
              </p>
            </div>

            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mb-5">
                <DollarSign size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                A <span className="text-orange-500">$400K+/year CTO</span> is out of reach for most startups
              </h3>
              <p className="text-[#888888] leading-relaxed">
                You need someone who understands blast radius, can read Terraform diffs, and knows when to say &quot;don&apos;t deploy on Friday at 5 PM.&quot; That expertise costs half a million — or one AI agent.
              </p>
            </div>
          </div>
        </div>

        {/* THE SOLUTION */}
        <div id="solution" className="mb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D838CB]/30 bg-[#D838CB]/10 mb-4">
              <Cog size={14} className="text-[#D838CB] animate-spin" style={{ animationDuration: "3s" }} />
              <span className="text-[#D838CB] text-sm font-medium">The Solution</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              The Core Loop:{" "}
              <span className="text-[#D838CB]">Observe → Reason → Act</span>
            </h2>
            <p className="text-lg text-[#888888] max-w-2xl mx-auto">
              An intelligent agent that watches your pipeline 24/7, understands context like a senior engineer, and takes action — with your permission.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-[#111111] border border-[#222222] rounded-3xl p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 md:gap-6 items-start">
                <div className="text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-[#D838CB] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                    <Eye size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Observe</h3>
                  <p className="text-sm text-[#888888]">Continuously monitors CI/CD events, git commits, deploy triggers, and infrastructure metrics in real-time.</p>
                </div>

                <div className="hidden md:flex items-center justify-center pt-5">
                  <ArrowRight size={32} className="text-[#D838CB]/60" />
                </div>
                <div className="md:hidden flex justify-center py-1">
                  <ArrowRight size={24} className="text-[#D838CB]/60 rotate-90" />
                </div>

                <div className="text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-[#D838CB] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                    <Brain size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Reason</h3>
                  <p className="text-sm text-[#888888]">Analyzes blast radius, evaluates risk scores, cross-references past failures, and decides the best course of action.</p>
                </div>

                <div className="hidden md:flex items-center justify-center pt-5">
                  <ArrowRight size={32} className="text-[#D838CB]/60" />
                </div>
                <div className="md:hidden flex justify-center py-1">
                  <ArrowRight size={24} className="text-[#D838CB]/60 rotate-90" />
                </div>

                <div className="text-center group">
                  <div className="w-16 h-16 rounded-2xl bg-[#D838CB] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                    <Zap size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Act</h3>
                  <p className="text-sm text-[#888888]">Proposes fixes, pushes back on risky deploys, or auto-remediates — always with human-in-the-loop approval.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div id="features" className="scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Built for{" "}
              <span className="text-[#D838CB]">real-world DevOps</span>
            </h2>
            <p className="text-lg text-[#888888] max-w-2xl mx-auto">
              Seven core capabilities that make DevOps Autopilot your most reliable team member.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#111111] border border-[#222222] rounded-2xl p-7 hover:border-[#D838CB] transition-colors"
              >
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-xs font-mono font-bold text-[#555555] tracking-wider">
                    {feature.number}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                    <feature.icon size={22} className="text-[#D838CB]" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#888888]">
                  {feature.description}
                </p>
              </div>
            ))}

            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-7 flex flex-col items-center justify-center text-center border-dashed">
              <div className="w-14 h-14 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
                <ArrowRight size={24} className="text-[#D838CB]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">See it in action</h3>
              <p className="text-sm text-[#888888] mb-5">
                Explore the live Command Center dashboard.
              </p>
              <Link
                href="/dashboard"
                className="px-6 py-2.5 rounded-full text-sm font-semibold bg-[#D838CB] text-white hover:scale-[1.03] transition-transform"
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
