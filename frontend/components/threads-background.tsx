"use client"

import { useEffect, useRef } from "react"

interface Thread {
  x: number
  y: number
  cp1x: number
  cp1y: number
  cp2x: number
  cp2y: number
  vx: number
  vy: number
  opacity: number
}

const THREAD_COUNT = 18
const COLORS = ["#00d4ff", "#00aadd"]
const BG_COLOR = "transparent"

export function ThreadsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const threadsRef = useRef<Thread[]>([])
  const frameRef = useRef<number>(0)
  const animationRef = useRef<number | null>(null)
  const mountedRef = useRef(true)

  const initThreads = (width: number, height: number) => {
    const threads: Thread[] = []
    for (let i = 0; i < THREAD_COUNT; i++) {
      threads.push(createThread(width, height))
    }
    threadsRef.current = threads
  }

  const createThread = (width: number, height: number): Thread => {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      cp1x: Math.random() * width,
      cp1y: Math.random() * height,
      cp2x: Math.random() * width,
      cp2y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      opacity: 0.25 + Math.random() * 0.10,
    }
  }

  const updateThread = (t: Thread, width: number, height: number) => {
    t.x += t.vx
    t.y += t.vy
    t.cp1x += t.vx * 1.2
    t.cp1y += t.vy * 1.2
    t.cp2x += t.vx * 0.8
    t.cp2y += t.vy * 0.8

    if (t.x < -200) t.x = width + 200
    if (t.x > width + 200) t.x = -200
    if (t.y < -200) t.y = height + 200
    if (t.y > height + 200) t.y = -200

    if (t.cp1x < -200) t.cp1x = width + 200
    if (t.cp1x > width + 200) t.cp1x = -200
    if (t.cp1y < -200) t.cp1y = height + 200
    if (t.cp1y > height + 200) t.cp1y = -200

    if (t.cp2x < -200) t.cp2x = width + 200
    if (t.cp2x > width + 200) t.cp2x = -200
    if (t.cp2y < -200) t.cp2y = height + 200
    if (t.cp2y > height + 200) t.cp2y = -200
  }

  const draw = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    frameRef.current++
    if (frameRef.current % 2 !== 0) {
      animationRef.current = requestAnimationFrame(draw)
      return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    threadsRef.current.forEach((t, i) => {
      updateThread(t, canvas.width, canvas.height)

      ctx.beginPath()
      ctx.moveTo(t.x, t.y)
      ctx.bezierCurveTo(t.cp1x, t.cp1y, t.cp2x, t.cp2y, t.x + 200, t.y + 50)
      ctx.strokeStyle = COLORS[i % COLORS.length]
      ctx.globalAlpha = t.opacity
      ctx.lineWidth = 1.2
      ctx.stroke()
    })

    ctx.globalAlpha = 1

    if (mountedRef.current) {
      animationRef.current = requestAnimationFrame(draw)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initThreads(canvas.width, canvas.height)
    }

    resize()
    window.addEventListener("resize", resize)

    animationRef.current = requestAnimationFrame(draw)

    return () => {
      mountedRef.current = false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-0 pointer-events-none"
      style={{ background: BG_COLOR }}
    />
  )
}