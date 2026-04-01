import Link from "next/link"
import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative mt-20 px-4 pb-8" id="team">
      <div className="mx-auto max-w-5xl">
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 md:p-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <p className="text-base font-medium text-white">Aditya Gangani | Utkarsh Kumar | Shivesh Tiwari</p>
              <div className="flex items-center gap-3 text-sm text-[#888888]">
                <span className="rounded-full border border-[#D838CB]/30 bg-[#D838CB]/10 px-3 py-1 text-xs font-medium text-[#D838CB]">
                  24-Hour Build
                </span>
                <span>ECE and CH 2023 Batch</span>
              </div>
            </div>

            <div className="h-px w-full bg-[#222222]" />

            <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-[#888888]">&copy; {new Date().getFullYear()} DevOps Autopilot. Built with grit.</p>

              <div className="flex items-center gap-4">
                <Link
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1a1a] text-[#888888] transition-all hover:bg-[#D838CB] hover:text-white"
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
