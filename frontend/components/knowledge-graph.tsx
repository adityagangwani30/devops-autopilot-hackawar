"use client"

import { useEffect, useRef, useState } from "react"

interface Node {
  id: string
  label: string
  x: number
  y: number
  color: string
  icon: string
}

const nodeColors: Record<string, string> = {
  api: "#0ea5e9",
  auth: "#10b981",
  users: "#10b981",
  orders: "#8b5cf6",
  payment: "#8b5cf6",
  db: "#f59e0b",
  cache: "#f59e0b",
  queue: "#f43f5e",
}

const staticLayout: { nodes: Node[]; links: { source: string; target: string }[] } = {
  nodes: [
    { id: "api", label: "API Gateway", x: 350, y: 200, color: "#0ea5e9", icon: "globe" },
    { id: "auth", label: "Auth", x: 200, y: 100, color: "#10b981", icon: "lock" },
    { id: "users", label: "Users", x: 500, y: 100, color: "#10b981", icon: "users" },
    { id: "orders", label: "Orders", x: 120, y: 200, color: "#8b5cf6", icon: "shopping" },
    { id: "payment", label: "Payment", x: 580, y: 200, color: "#8b5cf6", icon: "credit-card" },
    { id: "db", label: "Database", x: 350, y: 350, color: "#f59e0b", icon: "database" },
    { id: "cache", label: "Cache", x: 200, y: 350, color: "#f59e0b", icon: "zap" },
    { id: "queue", label: "Queue", x: 500, y: 350, color: "#f43f5e", icon: "activity" },
  ],
  links: [
    { source: "api", target: "auth" },
    { source: "api", target: "users" },
    { source: "api", target: "orders" },
    { source: "api", target: "payment" },
    { source: "orders", target: "db" },
    { source: "orders", target: "cache" },
    { source: "payment", target: "queue" },
    { source: "queue", target: "db" },
  ],
}

const icons: Record<string, string> = {
  lock: "M12 17a2 2 0 100-4 2 2 0 000 4zm6-9a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h1V6a5 5 0 0110 0v2h1zm-6-5a3 3 0 00-3 3v2h6V6a3 3 0 00-3-3z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  globe: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15 15 0 014 10 15 15 0 01-4 10M12 2a15 15 0 00-4 10 15 15 0 004 10",
  shopping: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  "credit-card": "M2 8h20M2 8h20v12H2zM2 8v12h20V8",
  database: "M12 3C7 3 3 5 3 8v8c0 3 4 5 9 5s9-2 9-5V8c0-3-4-5-9-5zM3 8c0-2 4-4 9-4s9 2 9 4M3 16c0 2 4 4 9 4s9-2 9-4",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
}

function NodeIcon({ type, color }: { type: string; color: string }) {
  const path = icons[type] || icons.globe
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ width: 14, height: 14 }}
    >
      <path d={path} />
    </svg>
  )
}

export function KnowledgeGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    setFadeIn(true)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width = canvas.offsetWidth || 700
    const height = canvas.height = canvas.offsetHeight || 450

    const paddingX = 60
    const paddingY = 50
    const graphWidth = width - paddingX * 2
    const graphHeight = height - paddingY * 2

    const scaleX = graphWidth / 600
    const scaleY = graphHeight / 400
    const scale = Math.min(scaleX, scaleY)

    const nodes = staticLayout.nodes.map((n) => ({
      ...n,
      x: paddingX + n.x * scale + (graphWidth - 600 * scale) / 2,
      y: paddingY + n.y * scale + (graphHeight - 400 * scale) / 2,
    }))

    const getNode = (id: string) => nodes.find((n) => n.id === id)!

    const draw = () => {
      ctx.fillStyle = "#0a0a0a"
      ctx.fillRect(0, 0, width, height)

      for (const link of staticLayout.links) {
        const source = getNode(link.source)
        const target = getNode(link.target)
        
        const isDirectConnection = hoveredNode && 
          (link.source === hoveredNode || link.target === hoveredNode)
        const isRelatedToHover = hoveredNode && 
          (link.source === hoveredNode || link.target === hoveredNode)
        const isDimmed = hoveredNode && !isDirectConnection

        let lineColor = "rgba(255, 255, 255, 0.1)"
        let lineWidth = 1

        if (hoveredNode) {
          if (isDirectConnection) {
            lineColor = "#eab308"
            lineWidth = 2
          } else {
            lineColor = "rgba(255, 255, 255, 0.03)"
          }
        }

        ctx.strokeStyle = lineColor
        ctx.lineWidth = lineWidth
        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.stroke()
      }

      for (const node of nodes) {
        const isHighlighted = hoveredNode === node.id
        const isConnected = hoveredNode && staticLayout.links.some(
          (l) => (l.source === hoveredNode && l.target === node.id) || 
                 (l.target === hoveredNode && l.source === node.id)
        )
        const isDimmed = hoveredNode && !isHighlighted && !isConnected

        const nodeColor = node.color
        const opacity = isDimmed ? 0.2 : 1

        ctx.globalAlpha = opacity

        ctx.shadowColor = nodeColor
        ctx.shadowBlur = isHighlighted ? 25 : 12
        ctx.beginPath()
        ctx.arc(node.x, node.y, 20, 0, Math.PI * 2)
        ctx.fillStyle = "#111827"
        ctx.fill()
        ctx.shadowBlur = 0

        ctx.strokeStyle = nodeColor
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(node.x, node.y, 10, 0, Math.PI * 2)
        ctx.fillStyle = nodeColor + "30"
        ctx.fill()

        const iconPath = icons[node.icon] || icons.globe
        ctx.save()
        ctx.translate(node.x - 7, node.y - 7)
        ctx.scale(0.6, 0.6)
        
        ctx.shadowColor = nodeColor
        ctx.shadowBlur = 4
        ctx.fillStyle = nodeColor
        
        const tempPath = new Path2D(iconPath)
        ctx.fill(tempPath)
        
        ctx.restore()

        ctx.globalAlpha = opacity
        ctx.fillStyle = isHighlighted ? "#ffffff" : isDimmed ? "#555555" : "#cccccc"
        ctx.font = "bold 11px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(node.label, node.x, node.y + 38)
      }

      ctx.globalAlpha = 1
    }

    draw()

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      let found: string | null = null
      for (const node of nodes) {
        const dx = mx - node.x
        const dy = my - node.y
        if (dx * dx + dy * dy < 441) {
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
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [hoveredNode])

  return (
    <section className="px-4 py-16 md:py-24" id="knowledge-graph">
      <div className="mx-auto max-w-6xl">
        <style jsx>{`
          @keyframes fadeInGraph {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .graph-container {
            animation: fadeInGraph 0.8s ease-out forwards;
          }
        `}</style>
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Infrastructure <span className="text-[#0ea5e9]">Knowledge Graph</span>
          </h2>
          <p className="text-lg text-[#888888]">
            Real-time visualization of your connected services and dependencies
          </p>
        </div>
        <div className="graph-container bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ 
              height: "450px", 
              cursor: "pointer",
              transition: "opacity 0.3s ease",
              opacity: fadeIn ? 1 : 0
            }}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-[#666666]">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#0ea5e9]" />API</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#10b981]" />Auth/Users</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#8b5cf6]" />Orders/Payment</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f59e0b]" />Database/Cache</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f43f5e]" />Queue</span>
        </div>
      </div>
    </section>
  )
}
