"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
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
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl" id="main-nav">
      <div className="bg-[#111111] border border-[#222222] rounded-full px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[#888888] hover:text-[#ffffff] transition-colors text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold bg-[#0ea5e9] text-[#ffffff] hover:scale-[1.03] transition-transform"
            id="nav-cta-launch"
          >
            <Rocket size={14} />
            Launch Autopilot
          </Link>
        </div>

        <button
          className="md:hidden text-[#ffffff]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#111111] border border-[#222222] mt-2 rounded-2xl p-4">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[#888888] hover:text-[#ffffff] transition-colors text-sm font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold bg-[#0ea5e9] text-[#ffffff]"
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
