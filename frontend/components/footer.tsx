import Link from "next/link"
import { Github } from "lucide-react"

export function Footer() {
  const currentYear = 2025

  return (
    <footer className="relative mt-20 px-4 pb-8" id="team">
      <div className="mx-auto max-w-5xl">
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 md:p-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-[#888888]">&copy; {currentYear} DevOps Autopilot. Built with grit.</p>

              <div className="flex items-center gap-4">
                <Link
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a] text-[#888888] transition-all hover:bg-[#0ea5e9] hover:text-white"
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
