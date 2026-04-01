import Link from "next/link"
import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative mt-20 px-4 pb-8" id="team">
      <div className="mx-auto max-w-5xl">
        <div className="glass-panel rounded-2xl p-6 md:p-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 shadow-[0_0_16px_rgba(45,212,191,0.35)]">
                <span className="text-[#060B18] text-sm font-bold">DA</span>
              </div>
              <span className="text-lg font-semibold text-foreground">DevOps Autopilot</span>
            </Link>

            <div className="flex flex-col items-center gap-2">
              <p className="text-base font-medium text-foreground">Aditya Gangani | Utkarsh Kumar | Shivesh Tiwari</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-300">
                  24-Hour Build
                </span>
                <span>ECE and CH 2023 Batch</span>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />

            <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} DevOps Autopilot. Built with grit.</p>

              <div className="flex items-center gap-4">
                <Link
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-muted-foreground transition-all hover:bg-cyan-400/20 hover:text-foreground"
                  aria-label="GitHub"
                >
                  <Github size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
