"use client"

import { useEffect, useRef, useState } from "react"

interface Node {
  id: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
}

interface Link {
  source: string
  target: string
}

const mockData = {
  nodes: [
    { id: "server", label: "Server" },
    { id: "database", label: "Database" },
    { id: "api", label: "API Gateway" },
    { id: "auth", label: "Auth Service" },
    { id: "cache", label: "Redis Cache" },
    { id: "queue", label: "Message Queue" },
    { id: "worker", label: "Worker" },
    { id: "storage", label: "S3 Storage" },
  ],
  links: [
    { source: "server", target: "api" },
    { source: "server", target: "database" },
    { source: "server", target: "cache" },
    { source: "api", target: "auth" },
    { source: "api", target: "queue" },
    { source: "database", target: "cache" },
    { source: "queue", target: "worker" },
    { source: "worker", target: "storage" },
    { source: "worker", target: "database" },
  ],
}

export function KnowledgeGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width = canvas.offsetWidth || 600
    const height = canvas.height = canvas.offsetHeight || 400

    const nodes: Node[] = mockData.nodes.map((n, i) => {
      const angle = (i / mockData.nodes.length) * Math.PI * 2
      const radius = Math.min(width, height) * 0.35
      return {
        id: n.id,
        label: n.label,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      }
    })

    const links: (Link & { sourceNode: Node; targetNode: Node })[] = mockData.links.map((l) => {
      const sourceNode = nodes.find((n) => n.id === l.source)!
      const targetNode = nodes.find((n) => n.id === l.target)!
      return { ...l, sourceNode, targetNode }
    })

    let animating = true

    const simulate = () => {
      if (!animating) return

      for (const node of nodes) {
        let fx = 0,
          fy = 0

        for (const other of nodes) {
          if (other.id === node.id) continue
          const dx = other.x - node.x
          const dy = other.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = -500 / (dist * dist)
          fx += (dx / dist) * force
          fy += (dy / dist) * force
        }

        for (const link of links) {
          const isConnected = link.sourceNode.id === node.id || link.targetNode.id === node.id
          if (isConnected) {
            const other = link.sourceNode.id === node.id ? link.targetNode : link.sourceNode
            const dx = other.x - node.x
            const dy = other.y - node.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const force = (dist - 100) * 0.05
            fx += (dx / dist) * force
            fy += (dy / dist) * force
          }
        }

        const centerX = width / 2
        const centerY = height / 2
        fx += (centerX - node.x) * 0.001
        fy += (centerY - node.y) * 0.001

        node.vx = node.vx * 0.9 + fx * 0.1
        node.vy = node.vy * 0.9 + fy * 0.1
        node.x += node.vx
        node.y += node.vy

        node.x = Math.max(50, Math.min(width - 50, node.x))
        node.y = Math.max(50, Math.min(height - 50, node.y))
      }
    }

    const draw = () => {
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, width, height)

      ctx.lineWidth = 2

      for (const link of links) {
        const isHighlighted =
          hoveredNode &&
          (link.sourceNode.id === hoveredNode || link.targetNode.id === hoveredNode)

        if (hoveredNode && !isHighlighted) {
          ctx.strokeStyle = "#222222"
        } else if (isHighlighted) {
          ctx.strokeStyle = "#D838CB"
        } else {
          ctx.strokeStyle = "#333333"
        }

        ctx.beginPath()
        ctx.moveTo(link.sourceNode.x, link.sourceNode.y)
        ctx.lineTo(link.targetNode.x, link.targetNode.y)
        ctx.stroke()
      }

      for (const node of nodes) {
        const isHighlighted = hoveredNode === node.id
        const isConnected =
          hoveredNode &&
          links.some(
            (l) =>
              l.sourceNode.id === hoveredNode && l.targetNode.id === node.id ||
              l.targetNode.id === hoveredNode && l.sourceNode.id === node.id
          )

        let fillColor = "#1a1a1a"
        let strokeColor = "#444444"
        let textColor = "#888888"

        if (hoveredNode) {
          if (isHighlighted) {
            fillColor = "#D838CB"
            strokeColor = "#D838CB"
            textColor = "#ffffff"
          } else if (isConnected) {
            fillColor = "#2a1a2a"
            strokeColor = "#D838CB"
            textColor = "#D838CB"
          }
        } else {
          fillColor = "#1a1a1a"
          strokeColor = "#333333"
          textColor = "#aaaaaa"
        }

        ctx.beginPath()
        ctx.arc(node.x, node.y, 18, 0, Math.PI * 2)
        ctx.fillStyle = fillColor
        ctx.fill()
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.fillStyle = textColor
        ctx.font = "11px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(node.label, node.x, node.y + 32)
      }
    }

    let frameId: number

    const loop = () => {
      simulate()
      draw()
      frameId = requestAnimationFrame(loop)
    }

    loop()

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      let found: string | null = null
      for (const node of nodes) {
        const dx = mx - node.x
        const dy = my - node.y
        if (dx * dx + dy * dy < 400) {
          found = node.id
          break
        }
      }
      setHoveredNode(found)
    }

    const handleMouseLeave = () => {
      setHoveredNode(null)
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      animating = false
      cancelAnimationFrame(frameId)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [hoveredNode])

  return (
    <section className="px-4 py-16 md:py-24" id="knowledge-graph">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Infrastructure <span className="text-[#D838CB]">Knowledge Graph</span>
          </h2>
          <p className="text-lg text-[#888888]">
            Real-time visualization of your connected services and dependencies
          </p>
        </div>
        <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: "400px", cursor: "pointer" }}
          />
        </div>
      </div>
    </section>
  )
}
