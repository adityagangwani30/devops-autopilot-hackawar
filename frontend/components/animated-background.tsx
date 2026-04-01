"use client"

import { useState, useEffect } from "react"

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="fixed inset-0 -z-10 bg-[#0a0a0a]" />
  }

  return (
    <div 
      className="fixed inset-0 -z-10"
      style={{
        background: '#0a0a0a',
      }}
    />
  )
}
