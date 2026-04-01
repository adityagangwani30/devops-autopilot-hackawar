import Link from "next/link"
import { Rocket, Play } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-8 md:pt-40 md:pb-12 px-4" id="hero">
      <div className="max-w-5xl mx-auto text-center">
        {/* Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
          </span>
          <span className="text-cyan-400 text-sm font-medium">
            Observe · Reason · Act — The Autonomous DevOps Loop
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight text-balance">
          DevOps Autopilot,{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Your AI CTO
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 text-pretty">
          An AI agent that observes your CI/CD pipeline, reasons about failures, and acts — diagnosed in seconds, fixed with one click, never blindly risky.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto group flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-base font-semibold text-[#060B18] bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:shadow-[0_0_50px_rgba(45,212,191,0.5)] hover:scale-[1.03] transition-all duration-300"
            id="cta-launch-autopilot"
          >
            <Rocket size={20} className="group-hover:rotate-12 transition-transform duration-300" />
            Launch Autopilot
          </Link>
          <Link
            href="#solution"
            className="w-full sm:w-auto flex items-center justify-center gap-2 liquid-glass-button px-8 py-3.5 rounded-full text-base font-semibold text-foreground"
            id="cta-watch-demo"
          >
            <Play size={18} className="fill-current" />
            Watch Demo
          </Link>
        </div>
      </div>
    </section>
  )
}
