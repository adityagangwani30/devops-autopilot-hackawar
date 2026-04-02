export interface CveEntry {
  id: string
  package: string
  version: string
  severity: string
  description: string
  link: string
  published: string
}

export interface DashboardInsights {
  summary: {
    totalRepositories: number
    analyzedRepositories: number
    failedRepositories: number
    graphNodes: number
    graphEdges: number
    totalOpenIssues: number
    totalCiFindings: number
    totalSuggestions: number
    totalWorkflows: number
    weeklyPushes: number
    weeklyCommits: number
  }
  weeklyPushFrequency: Array<{
    label: string
    date: string
    pushes: number
    commits: number
  }>
  recentPushes: Array<{
    id: string
    repoFullName: string
    branch: string
    pushedAt: string
    commits: number
  }>
  graphComposition: Array<{
    type: string
    count: number
  }>
  languageDistribution: Array<{
    language: string
    count: number
  }>
  topRepositories: Array<{
    repoFullName: string
    primaryLanguage: string | null
    status: string
    summary: string | null
    updatedAt: string
    openIssues: number
    workflows: number
    ciFindings: number
    suggestions: number
    score: number
  }>
  cves?: CveEntry[]
  error?: string | null
}

export interface GraphNode {
  id: string
  repoFullName: string
  label: string
  type: string
  properties: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  repoFullName: string
  source: string
  target: string
  type: string
  label: string | null
  properties: Record<string, unknown>
}

export interface AnalysisSummary {
  repoFullName: string
  repoName: string
  status: string
  summary: string | null
  analyzedAt: string | null
  lastError: string | null
}

export interface KnowledgeGraphResponse {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: {
    analyzedRepositories: number
    failedRepositories: number
    graphNodes: number
    graphEdges: number
  }
  analyses: AnalysisSummary[]
}
