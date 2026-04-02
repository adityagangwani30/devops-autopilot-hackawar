import { ArrowRight, Eye, Zap, Lightbulb, Cog } from "lucide-react"

export function SolutionSection() {
  return (
    <section id="solution" className="w-full py-16 md:py-24 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/10 mb-6">
            <Cog size={14} className="text-[#0ea5e9] animate-spin" style={{ animationDuration: "3s" }} />
            <span className="text-[#0ea5e9] text-sm font-medium">How It Works</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            The Core Loop:{" "}
            <span className="text-[#0ea5e9]">Observe → Reason → Act</span>
          </h2>
          <p className="text-lg text-[#888888] max-w-3xl mx-auto">
            An intelligent agent that watches your pipeline 24/7, understands context like a senior engineer, and takes action — with your approval.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-[#111111] border border-[#222222] rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 md:gap-8 items-start">
              <div className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-[#0ea5e9] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                  <Eye size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Observe</h3>
                <p className="text-sm text-[#888888]">Continuously monitors CI/CD events, git commits, deploy triggers, and infrastructure metrics in real-time.</p>
              </div>

              <div className="hidden md:flex items-center justify-center pt-5">
                <ArrowRight size={32} className="text-[#0ea5e9]/60" />
              </div>
              <div className="md:hidden flex justify-center py-4">
                <ArrowRight size={24} className="text-[#0ea5e9]/60 rotate-90" />
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-[#0ea5e9] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                  <Lightbulb size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Reason</h3>
                <p className="text-sm text-[#888888]">Analyzes blast radius, evaluates risk scores, cross-references past failures, and decides the best course of action.</p>
              </div>

              <div className="hidden md:flex items-center justify-center pt-5">
                <ArrowRight size={32} className="text-[#0ea5e9]/60" />
              </div>
              <div className="md:hidden flex justify-center py-4">
                <ArrowRight size={24} className="text-[#0ea5e9]/60 rotate-90" />
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-[#0ea5e9] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                  <Zap size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Act</h3>
                <p className="text-sm text-[#888888]">Proposes fixes, pushes back on risky deploys, or auto-remediates — always with human-in-the-loop approval.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}