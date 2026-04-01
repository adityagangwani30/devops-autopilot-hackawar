import Link from "next/link"
import { Rocket, Play } from "lucide-react"
import Prism from "@/components/Prism"

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden px-4 pt-32 pb-24 md:pt-40 md:pb-32" id="hero">
      <div
        className="absolute inset-0 z-0 opacity-50"
        style={{
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black 40%, transparent 100%)',
        }}
      >
        <Prism animationType="3drotate" noise={0.03} bloom={1.2} scale={2.0} />
      </div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_30%,rgba(45,212,191,0.2),transparent_62%)]" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
          </span>
          <span className="text-sm font-medium text-cyan-400">Observe | Reason | Act - The Autonomous DevOps Loop</span>
        </div>

        <h1 className="mb-6 text-4xl font-bold leading-tight text-balance text-foreground md:text-6xl lg:text-7xl">
          DevOps Autopilot,{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Your AI CTO
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-3xl text-lg text-muted-foreground text-pretty md:text-xl">
          An AI agent that observes your CI/CD pipeline, reasons about failures, and acts - diagnosed in seconds, fixed
          with one click, never blindly risky.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 px-8 py-4 text-base font-semibold text-[#060B18] shadow-[0_0_30px_rgba(45,212,191,0.3)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_50px_rgba(45,212,191,0.5)] sm:w-auto"
            id="cta-launch-autopilot"
          >
            <Rocket size={20} className="transition-transform duration-300 group-hover:rotate-12" />
            Launch Autopilot
          </Link>
          <Link
            href="#solution"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-teal-400/35 bg-[#111d33]/70 px-8 py-3.5 text-base font-semibold text-foreground shadow-[0_0_24px_rgba(45,212,191,0.14)] transition-all duration-300 hover:scale-[1.02] hover:border-teal-300/60 hover:shadow-[0_0_38px_rgba(45,212,191,0.26)] sm:w-auto"
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
