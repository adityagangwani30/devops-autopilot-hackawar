import { Github, GitPullRequest, GitCommit, GitBranch, CheckCircle } from "lucide-react"

export function GitHubIntegration() {
  return (
    <section className="w-full py-16 md:py-24" id="github-integration">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 w-full">
            <div className="flex justify-center lg:justify-start w-full">
              <div className="w-full max-w-md">
                <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                  <div className="bg-[#0f0f0f] px-4 py-3 border-b border-[#222222]">
                    <div className="flex items-center gap-2 mb-2">
                      <Github size={16} className="text-[#888888]" />
                      <span className="text-[#666666] text-xs">Pull Request #482</span>
                    </div>
                    <div className="text-white font-medium text-sm">fix: resolve auth timeout in high load</div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      <span className="text-white text-xs">2 checks passed</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      <span className="text-white text-xs">1 conversation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      <span className="text-white text-xs">+124 / -8 lines</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-[#222222] bg-[#0a0a0a]">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">INCIDENT</span>
                      <span className="text-[#666666] text-xs">Linked to #auth-timeout</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 w-full">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/10">
              <Github size={14} className="text-[#0ea5e9]" />
              <span className="text-sm font-medium text-[#0ea5e9]">Feature</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              GitHub Integration
            </h2>
            <p className="text-lg text-[#888888] mb-8 leading-relaxed">
              Seamless two-way sync with GitHub — PRs, commits, and issues automatically linked to incidents and deployments, with no manual tagging needed.
            </p>
            <ul className="space-y-4 text-[#aaaaaa]">
              <li className="flex items-start gap-3">
                <GitPullRequest size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Automatic PR-incident linking</span>
              </li>
              <li className="flex items-start gap-3">
                <GitCommit size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Commit-level impact analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <GitBranch size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Branch deployment tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}