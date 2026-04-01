"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, Rocket } from "lucide-react"

const navItems = [
  { label: "Problem", href: "#problem" },
  { label: "Solution", href: "#solution" },
  { label: "Features", href: "#features" },
  { label: "Team", href: "#team" },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl" id="main-nav">
      <div className="glass-nav rounded-full px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-[0_0_12px_rgba(45,212,191,0.3)]">
            <span className="text-[#060B18] font-bold text-sm">DA</span>
          </div>
          <span className="text-foreground font-semibold text-lg tracking-tight">
            DevOps Autopilot
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-[#060B18] bg-gradient-to-r from-teal-400 to-cyan-400 shadow-[0_0_20px_rgba(45,212,191,0.25)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] hover:scale-[1.03] transition-all duration-300"
            id="nav-cta-launch"
          >
            <Rocket size={14} />
            Launch Autopilot
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-nav mt-2 rounded-2xl p-4">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-center text-[#060B18] bg-gradient-to-r from-teal-400 to-cyan-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Rocket size={14} />
              Launch Autopilot
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
