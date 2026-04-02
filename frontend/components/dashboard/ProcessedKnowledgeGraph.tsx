"use client"

import type { GraphEdge, GraphNode } from "@/lib/dashboard-types"

const nodeColors: Record<string, string> = {
  repository: "#2dd4bf",
  workflow: "#38bdf8",
  language: "#f59e0b",
  ci_issue: "#f97316",
  suggestion: "#a78bfa",
}

const visibleNodeTypes = new Set([
  "repository",
  "workflow",
  "language",
  "ci_issue",
  "suggestion",
])

function truncateLabel(value: string, limit: number) {
  if (value.length <= limit) {
    return value
  }

  return `${value.slice(0, Math.max(limit - 1, 1))}...`
}

function getTypePriority(type: string) {
  switch (type) {
    case "repository":
      return 0
    case "language":
      return 1
    case "workflow":
      return 2
    case "ci_issue":
      return 3
    case "suggestion":
      return 4
    default:
      return 5
  }
}

interface ProcessedKnowledgeGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  compact?: boolean
  selectedNodeId?: string | null
  onSelectNode?: (node: GraphNode) => void
}

export function ProcessedKnowledgeGraph({
  nodes,
  edges,
  compact = false,
  selectedNodeId = null,
  onSelectNode,
}: ProcessedKnowledgeGraphProps) {
  const maxRepositories = compact ? 3 : 5
  const maxColumnNodes = compact ? 3 : 5
  const width = compact ? 820 : 1060
  const columns = compact
    ? { repository: 110, language: 300, workflow: 500, findings: 700 }
    : { repository: 130, language: 380, workflow: 640, findings: 900 }

  const candidateNodes = nodes.filter((node) => visibleNodeTypes.has(node.type))
  const groups = new Map<string, GraphNode[]>()

  candidateNodes.forEach((node) => {
    const bucket = groups.get(node.repoFullName) || []
    bucket.push(node)
    groups.set(node.repoFullName, bucket)
  })

  const repositoryGroups = Array.from(groups.entries())
    .map(([repoFullName, repoNodes]) => {
      const repositoryNode = repoNodes.find((node) => node.type === "repository")
      const languageNodes = repoNodes
        .filter((node) => node.type === "language")
        .sort((left, right) => left.label.localeCompare(right.label))
        .slice(0, maxColumnNodes)
      const workflowNodes = repoNodes
        .filter((node) => node.type === "workflow")
        .sort((left, right) => left.label.localeCompare(right.label))
        .slice(0, maxColumnNodes)
      const findingNodes = repoNodes
        .filter((node) => node.type === "ci_issue" || node.type === "suggestion")
        .sort((left, right) => {
          const byType = getTypePriority(left.type) - getTypePriority(right.type)
          if (byType !== 0) {
            return byType
          }
          return left.label.localeCompare(right.label)
        })
        .slice(0, maxColumnNodes)

      return {
        repoFullName,
        nodes: [
          ...(repositoryNode ? [repositoryNode] : []),
          ...languageNodes,
          ...workflowNodes,
          ...findingNodes,
        ],
        score: findingNodes.length * 4 + workflowNodes.length * 2 + languageNodes.length,
      }
    })
    .filter((group) => group.nodes.length > 0)
    .sort((left, right) => right.score - left.score || left.repoFullName.localeCompare(right.repoFullName))
    .slice(0, maxRepositories)

  const includedNodeIds = new Set(
    repositoryGroups.flatMap((group) => group.nodes.map((node) => node.id)),
  )
  const filteredEdges = edges.filter(
    (edge) => includedNodeIds.has(edge.source) && includedNodeIds.has(edge.target),
  )

  let currentY = 80
  const positions: Record<string, { x: number; y: number }> = {}

  repositoryGroups.forEach((group) => {
    const repositoryNode = group.nodes.find((node) => node.type === "repository")
    const languageNodes = group.nodes.filter((node) => node.type === "language")
    const workflowNodes = group.nodes.filter((node) => node.type === "workflow")
    const findingNodes = group.nodes.filter(
      (node) => node.type === "ci_issue" || node.type === "suggestion",
    )

    const tallestColumn = Math.max(
      languageNodes.length,
      workflowNodes.length,
      findingNodes.length,
      1,
    )
    const groupHeight = Math.max(compact ? 200 : 230, tallestColumn * 82 + 30)
    const centerY = currentY + groupHeight / 2

    if (repositoryNode) {
      positions[repositoryNode.id] = { x: columns.repository, y: centerY }
    }

    languageNodes.forEach((node, index) => {
      positions[node.id] = { x: columns.language, y: currentY + 56 + index * 82 }
    })

    workflowNodes.forEach((node, index) => {
      positions[node.id] = { x: columns.workflow, y: currentY + 56 + index * 82 }
    })

    findingNodes.forEach((node, index) => {
      positions[node.id] = { x: columns.findings, y: currentY + 56 + index * 82 }
    })

    currentY += groupHeight + 36
  })

  const height = Math.max(currentY, compact ? 280 : 420)

  if (repositoryGroups.length === 0) {
    return (
      <div
        style={{
          padding: compact ? "28px 22px" : "42px 28px",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        <p style={{ color: "var(--text-primary)", fontSize: compact ? ".82rem" : ".94rem" }}>
          No processed graph data is available yet.
        </p>
        <p style={{ marginTop: "8px", fontSize: ".72rem" }}>
          Analyze repositories first, then build the knowledge graph to visualize the current project structure.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: "grid", gap: compact ? "10px" : "14px" }}>
      <div style={{ overflow: "auto", borderRadius: "16px", border: "1px solid var(--border)" }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{
            display: "block",
            minWidth: `${width}px`,
            background: "linear-gradient(180deg, rgba(6,10,17,0.98), rgba(9,15,24,0.94))",
          }}
        >
          <defs>
            <pattern id={compact ? "processed-grid-compact" : "processed-grid"} width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill={`url(#${compact ? "processed-grid-compact" : "processed-grid"})`}
          />

          {filteredEdges.map((edge) => {
            const source = positions[edge.source]
            const target = positions[edge.target]

            if (!source || !target) {
              return null
            }

            return (
              <line
                key={edge.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="rgba(148,163,184,0.22)"
                strokeWidth="2"
              />
            )
          })}

          {repositoryGroups.flatMap((group) => group.nodes).map((node) => {
            const position = positions[node.id]
            if (!position) {
              return null
            }

            const fill = nodeColors[node.type] || "#94a3b8"
            const isSelected = selectedNodeId === node.id

            return (
              <g
                key={node.id}
                transform={`translate(${position.x}, ${position.y})`}
                onClick={() => onSelectNode?.(node)}
                style={{ cursor: onSelectNode ? "pointer" : "default" }}
              >
                <rect
                  x={compact ? -62 : -70}
                  y={-26}
                  rx="18"
                  width={compact ? 124 : 140}
                  height="52"
                  fill="rgba(10,15,24,0.94)"
                  stroke={isSelected ? fill : "rgba(255,255,255,0.12)"}
                  strokeWidth={isSelected ? 3 : 1.4}
                />
                <circle cx={compact ? -40 : -46} cy="0" r="7" fill={fill} />
                <text
                  x={compact ? -24 : -28}
                  y="-2"
                  fill="#f8fafc"
                  fontSize={compact ? "11" : "12"}
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {truncateLabel(node.label, compact ? 14 : 18)}
                </text>
                <text
                  x={compact ? -24 : -28}
                  y="14"
                  fill="rgba(255,255,255,0.58)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {node.type.replace("_", " ")}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {Object.entries(nodeColors).map(([type, color]) => (
          <span
            key={type}
            className="dash-card-badge"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "999px",
                background: color,
                display: "inline-block",
              }}
            />
            {type.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  )
}
