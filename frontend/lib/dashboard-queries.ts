import { useQuery } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"

export function useDashboardInsights() {
  return useQuery({
    queryKey: ["dashboard-insights"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/insights")
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard insights")
      }
      return response.json()
    },
  })
}

export function useKnowledgeGraph() {
  return useQuery({
    queryKey: ["knowledge-graph"],
    queryFn: async () => {
      const response = await fetch("/api/knowledge-graph")
      if (!response.ok) {
        throw new Error("Failed to fetch knowledge graph")
      }
      return response.json()
    },
  })
}

export function useGitHubRepositories() {
  return useQuery({
    queryKey: ["github-repositories"],
    queryFn: async () => {
      const response = await fetch("/api/github/repos")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch GitHub repositories")
      }
      return response.json()
    },
  })
}