import { AlertTriangle, Eye, DollarSign } from "lucide-react"

export function ProblemSection() {
  return (
    <section id="problem" className="w-full py-16 md:py-24 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/20 bg-red-500/5 mb-6">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-red-500 text-sm font-medium">The Challenge</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            What Are the Problems?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 hover:border-red-500/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
              <Eye size={28} className="text-red-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
              Reactive alerts <span className="text-red-500">after</span> incidents occur
            </h3>
            <p className="text-[#888888] text-lg leading-relaxed">
              Traditional monitoring notifies you when production issues already affect users. By then, damage is done — you&apos;re always fixing problems instead of preventing them.
            </p>
          </div>

          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 hover:border-orange-500/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6">
              <DollarSign size={28} className="text-orange-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-white mb-4">
              Senior DevOps expertise <span className="text-orange-500">costs $400K+</span> annually
            </h3>
            <p className="text-[#888888] text-lg leading-relaxed">
              You need someone who understands blast radius, reads Terraform diffs, and knows when to say &quot;don&apos;t deploy on Friday.&quot; That level of expertise is expensive.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}