// ═══════════════════════════════════════════════════════════════════
// CostAdvisorDashboard.tsx - Lazy-loaded wrapper
// Purpose: Code-split the cost advisor from initial page load
// Performance: Uses next/dynamic with ssr: false to prevent blocking
//              Shows skeleton while loading, transitions smoothly
// ═══════════════════════════════════════════════════════════════════

"use client"

import dynamic from "next/dynamic"
import { useState, useEffect } from "react"

const CostAdvisorSummary = dynamic(
  () => import("@/components/CostAdvisorSummary").then((mod) => mod.CostAdvisorSummary),
  {
    ssr: false,
    loading: () => <CostAdvisorSkeleton />,
  }
)

function CostAdvisorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
            <div className="mt-4 h-8 w-32 animate-pulse rounded bg-slate-800" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-slate-800" />
            ))}
          </div>
        </div>
        <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CostAdvisorDashboard() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "100px" }
    )

    const element = document.getElementById("cost-advisor-section")
    if (element) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div id="cost-advisor-section" className="min-h-[400px]">
      {isVisible ? <CostAdvisorSummary /> : <CostAdvisorSkeleton />}
    </div>
  )
}