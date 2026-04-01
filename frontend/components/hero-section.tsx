import Link from "next/link"
import { Rocket, Play } from "lucide-react"
import Prism from "@/components/Prism"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pt-32 pb-24 md:pt-40 md:pb-32" id="hero">
      <div className="absolute inset-0 z-0 opacity-30">
        <Prism animationType="3drotate" noise={0.01} bloom={0.4} scale={1.2} hueShift={0.85} suspendWhenOffscreen={true} />
      </div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_30%,rgba(216,56,203,0.15),transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D838CB]/30 bg-[#D838CB]/10 px-4 py-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D838CB] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D838CB]" />
          </span>
          <span className="text-sm font-medium text-[#D838CB]">Observe | Reason | Act</span>
        </div>

        <h1 className="mb-4 text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
          AI-Powered DevOps Command Center
        </h1>
        
        <p className="mb-8 text-lg text-[#888888] md:text-xl">
          Streamline deployments. Visualize infrastructure. Conquer the cloud.
        </p>

        <p className="mx-auto mb-10 max-w-3xl text-lg text-[#888888] md:text-xl">
          An AI agent that observes your CI/CD pipeline, reasons about failures, and acts - diagnosed in seconds, fixed
          with one click, never blindly risky.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#D838CB] px-8 py-4 text-base font-semibold text-white hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all sm:w-auto"
            id="cta-launch-autopilot"
          >
            <Rocket size={20} />
            Launch Autopilot
          </Link>
          <Link
            href="#solution"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#333333] bg-[#111111] px-8 py-3.5 text-base font-semibold text-white hover:border-[#D838CB] hover:scale-[1.02] transition-all sm:w-auto"
            id="cta-watch-demo"
          >
            <Play size={18} />
            Watch Demo
          </Link>
        </div>
      </div>
    </section>
  )
}
