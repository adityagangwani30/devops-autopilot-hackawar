import { Github, GitBranch, GitPullRequest, GitCommit, CheckCircle } from "lucide-react"

export function RepositorySyncing() {
  return (
    <section className="w-full py-16 md:py-24" id="repository-syncing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="w-full">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0ea5e9]/30 bg-[#0ea5e9]/10">
              <Github size={14} className="text-[#0ea5e9]" />
              <span className="text-sm font-medium text-[#0ea5e9]">Feature</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Seamless Repository Syncing
            </h2>
            <p className="text-lg text-[#888888] mb-8 leading-relaxed">
              Connect your GitHub repositories and get real-time visibility into commits, branches, pull requests, and deployments. The AI monitors code changes and alerts you to infrastructure-impacting commits before they cause issues.
            </p>
            <ul className="space-y-4 text-[#aaaaaa]">
              <li className="flex items-start gap-3">
                <GitBranch size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Track all branches and their deployment status</span>
              </li>
              <li className="flex items-start gap-3">
                <GitPullRequest size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Monitor PRs and their impact on production</span>
              </li>
              <li className="flex items-start gap-3">
                <GitCommit size={20} className="text-[#0ea5e9] mt-0.5 flex-shrink-0" />
                <span>Instant alerts on critical commits</span>
              </li>
            </ul>
          </div>
          <div className="flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-sm">
              <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='240' viewBox='0 0 360 240'%3E%3Crect fill='%23111111' width='360' height='240' rx='8'/%3E%3Crect fill='%231a1a1a' x='16' y='16' width='328' height='60' rx='6'/%3E%3Ccircle fill='%2322c55e' cx='36' cy='46' r='6'/%3E%3Crect fill='%23222' x='52' y='38' width='160' height='14' rx='3'/%3E%3Crect fill='%23222' x='52' y='56' width='100' height='10' rx='2'/%3E%3Crect fill='%231a1a1a' x='16' y='88' width='328' height='60' rx='6'/%3E%3Ccircle fill='%230ea5e9' cx='36' cy='118' r='6'/%3E%3Crect fill='%23222' x='52' y='110' width='140' height='14' rx='3'/%3E%3Crect fill='%23222' x='52' y='128' width='180' height='10' rx='2'/%3E%3Crect fill='%231a1a1a' x='16' y='160' width='328' height='60' rx='6'/%3E%3Ccircle fill='%23a855f7' cx='36' cy='190' r='6'/%3E%3Crect fill='%23222' x='52' y='182' width='120' height='14' rx='3'/%3E%3Crect fill='%23222' x='52' y='200' width='200' height='10' rx='2'/%3E%3C/svg%3E"
                alt="Repository Syncing UI"
                className="w-full h-auto rounded-xl border border-[#0ea5e9]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}