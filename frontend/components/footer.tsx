import Link from "next/link"
import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative mt-20 px-4 pb-8" id="team">
      <div className="max-w-5xl mx-auto">
        <div className="glass-panel rounded-2xl p-6 md:p-8">
          <div className="flex flex-col items-center gap-6 text-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-[0_0_12px_rgba(45,212,191,0.3)]">
                <span className="text-[#060B18] font-bold text-sm">DA</span>
              </div>
              <span className="text-foreground font-semibold text-lg">DevOps Autopilot</span>
            </Link>

            {/* Team Credits */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-foreground font-medium text-base">
                Aditya Gangani · Utkarsh Kumar · Shivesh Tiwari
              </p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 text-xs font-medium">
                  24-Hour Build
                </span>
                <span>ECE &amp; CH 2023 Batch</span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Bottom row */}
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
              <p className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()} DevOps Autopilot. Built with ☕ and ambition.
              </p>

              <div className="flex items-center gap-4">
                <Link
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
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
