import { getKnowledgeGraphForUser, listStoredAnalysesForUser } from "@/lib/server/analysis-store"
import {
  getGitHubAccessTokenForUser,
  listGitHubReposForUser,
  listRecentPushEventsForUser,
  type GitHubRepoSummary,
  type GitHubPushEventSummary,
} from "@/lib/server/github"

function safeJsonParse<T>(value: string | null | undefined, fallback: T) {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function getDashboardInsights(userId: string) {
  let githubAccessToken: string | null = null
  let hasValidToken = false
  try {
    githubAccessToken = await getGitHubAccessTokenForUser(userId)
    hasValidToken = true
  } catch (tokenError) {
    console.warn("GitHub token not available, will use database data only")
  }

  const [analyses, graph] = await Promise.all([
    listStoredAnalysesForUser(userId),
    getKnowledgeGraphForUser(userId),
  ])

  let repositories: GitHubRepoSummary[] = []
  let pushEvents: GitHubPushEventSummary[] = []

  if (hasValidToken && githubAccessToken) {
    try {
      const results = await Promise.all([
        listGitHubReposForUser(githubAccessToken),
        listRecentPushEventsForUser(githubAccessToken),
      ])
      repositories = results[0]
      pushEvents = results[1]
    } catch (githubError) {
      console.error("GitHub API error:", githubError)
    }
  }

  if (repositories.length === 0 && analyses.length > 0) {
    repositories = analyses
      .filter((a) => a.status === "completed")
      .map((analysis) => ({
        id: analysis.id,
        fullName: analysis.repoFullName,
        name: analysis.repoName,
        ownerLogin: analysis.ownerLogin,
        ownerAvatarUrl: null,
        description: analysis.description,
        htmlUrl: analysis.htmlUrl || `https://github.com/${analysis.repoFullName}`,
        isPrivate: Boolean(analysis.isPrivate),
        visibility: analysis.isPrivate ? "private" : "public",
        defaultBranch: analysis.defaultBranch || "main",
        primaryLanguage: analysis.primaryLanguage,
        stargazersCount: 0,
        forksCount: 0,
        openIssuesCount: 0,
        updatedAt: analysis.updatedAt?.toISOString() || new Date().toISOString(),
      }))
  }

  const analysisMap = new Map(
    analyses.map((analysis) => [analysis.repoFullName, analysis]),
  )
  const ownedRepoNames = new Set(repositories.map((repo) => repo.fullName))

  const recentPushes = pushEvents
    .filter((event) => ownedRepoNames.has(event.repoFullName))
    .sort((left, right) => right.pushedAt.localeCompare(left.pushedAt))

  const now = new Date()
  const dayBuckets = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    return {
      date,
      key: formatDateKey(date),
      label: formatDayLabel(date),
      pushes: 0,
      commits: 0,
    }
  })
  const dayBucketMap = new Map(dayBuckets.map((bucket) => [bucket.key, bucket]))

  recentPushes.forEach((event) => {
    const key = event.pushedAt.slice(0, 10)
    const bucket = dayBucketMap.get(key)
    if (bucket) {
      bucket.pushes += 1
      bucket.commits += event.commits
    }
  })

  const graphCompositionMap = new Map<string, number>()
  graph.nodes.forEach((node) => {
    graphCompositionMap.set(node.type, (graphCompositionMap.get(node.type) || 0) + 1)
  })

  const languageMap = new Map<string, number>()
  repositories.forEach((repo) => {
    if (!repo.primaryLanguage) {
      return
    }
    languageMap.set(
      repo.primaryLanguage,
      (languageMap.get(repo.primaryLanguage) || 0) + 1,
    )
  })

  const topRepositories = repositories
    .map((repo) => {
      const analysis = analysisMap.get(repo.fullName)
      const workflows = safeJsonParse<Array<unknown>>(analysis?.workflowsJson, [])
      const issues = safeJsonParse<Array<unknown>>(analysis?.issuesJson, [])
      const ciIssues = safeJsonParse<Array<unknown>>(analysis?.ciIssuesJson, [])
      const suggestions = safeJsonParse<Array<unknown>>(analysis?.suggestionsJson, [])

      return {
        repoFullName: repo.fullName,
        primaryLanguage: repo.primaryLanguage,
        status: analysis?.status ?? "not_analyzed",
        summary: analysis?.summary ?? null,
        updatedAt: repo.updatedAt,
        openIssues: issues.length > 0 ? issues.length : repo.openIssuesCount,
        workflows: workflows.length,
        ciFindings: ciIssues.length,
        suggestions: suggestions.length,
        score: repo.openIssuesCount + ciIssues.length * 2 + suggestions.length,
      }
    })
    .sort((left, right) => right.score - left.score || left.repoFullName.localeCompare(right.repoFullName))
    .slice(0, 6)

  const totalOpenIssues = repositories.reduce((sum, repo) => sum + repo.openIssuesCount, 0)
  const totalCiFindings = analyses.reduce(
    (sum, analysis) => sum + safeJsonParse<Array<unknown>>(analysis.ciIssuesJson, []).length,
    0,
  )
  const totalSuggestions = analyses.reduce(
    (sum, analysis) => sum + safeJsonParse<Array<unknown>>(analysis.suggestionsJson, []).length,
    0,
  )
  const totalWorkflows = analyses.reduce(
    (sum, analysis) => sum + safeJsonParse<Array<unknown>>(analysis.workflowsJson, []).length,
    0,
  )

  const errorMessage = !hasValidToken 
    ? "GitHub token not available - showing database data only"
    : repositories.length === 0 && analyses.length > 0
      ? "GitHub API failed - showing stored analysis data"
      : null

  // Collect dependencies from analyzed repos and query OSV.dev for CVEs
  let cves: Array<{
    id: string
    package: string
    version: string
    severity: string
    description: string
    link: string
    published: string
  }> = []
  
  try {
    const dependencyMap = new Map<string, string>()
    
    for (const analysis of analyses) {
      if (analysis.status !== "completed") continue
      const deps = safeJsonParse<Record<string, string>>(
        (analysis as any).dependenciesJson,
        {}
      )
      for (const [name, version] of Object.entries(deps)) {
        if (!dependencyMap.has(name)) {
          dependencyMap.set(name, version)
        }
      }
    }

    if (dependencyMap.size > 0) {
      // Query top 20 dependencies via OSV.dev
      const packagesToCheck = Array.from(dependencyMap.entries()).slice(0, 20)
      const seenCves = new Set<string>()

      const batchSize = 5
      for (let i = 0; i < packagesToCheck.length; i += batchSize) {
        const batch = packagesToCheck.slice(i, i + batchSize)
        const results = await Promise.all(
          batch.map(async ([name, version]) => {
            try {
              const cleanVersion = version.replace(/^[\^~>=<]+/, "").trim()
              const resp = await fetch("https://api.osv.dev/v1/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  package: { name, ecosystem: "npm" },
                  version: cleanVersion,
                }),
              })
              if (!resp.ok) return { name, vulns: [] }
              const data = await resp.json()
              return { name, vulns: (data.vulns || []) as any[] }
            } catch {
              return { name, vulns: [] }
            }
          })
        )

        for (const { name, vulns } of results) {
          for (const vuln of vulns) {
            const cveId = vuln.aliases?.find((a: string) => a.startsWith("CVE-")) || vuln.id
            if (seenCves.has(cveId)) continue
            seenCves.add(cveId)

            let severity = "Medium"
            if (vuln.database_specific?.severity) {
              severity = vuln.database_specific.severity
            } else if (vuln.severity?.length) {
              for (const sev of vuln.severity) {
                if (sev.type === "CVSS_V3") {
                  const score = parseFloat(sev.score)
                  if (score >= 9.0) severity = "Critical"
                  else if (score >= 7.0) severity = "High"
                  else if (score >= 4.0) severity = "Medium"
                  else severity = "Low"
                }
              }
            }

            let affectedVersions = "unknown"
            if (vuln.affected) {
              for (const affected of vuln.affected) {
                if (affected.package?.name !== name) continue
                if (affected.ranges?.length) {
                  for (const range of affected.ranges) {
                    const fixed = range.events?.find((e: any) => e.fixed)?.fixed
                    const introduced = range.events?.find((e: any) => e.introduced)?.introduced
                    if (introduced && fixed) affectedVersions = `>=${introduced}, <${fixed}`
                    else if (fixed) affectedVersions = `<${fixed}`
                    else if (introduced && introduced !== "0") affectedVersions = `>=${introduced}`
                  }
                }
              }
            }

            let link = `https://osv.dev/vulnerability/${vuln.id}`
            if (cveId.startsWith("CVE-")) {
              link = `https://nvd.nist.gov/vuln/detail/${cveId}`
            } else if (vuln.references?.length) {
              const advisory = vuln.references.find((r: any) => r.type === "ADVISORY" && r.url)
              if (advisory?.url) link = advisory.url
            }

            cves.push({
              id: cveId,
              package: name,
              version: affectedVersions,
              severity,
              description: vuln.summary || (vuln.details ? vuln.details.slice(0, 200) : "No description available"),
              link,
              published: vuln.published || vuln.modified || new Date().toISOString().split("T")[0],
            })
          }
        }
      }

      // Sort by severity
      const severityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
      cves.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4))
      cves = cves.slice(0, 30)
    }
  } catch (cveError) {
    console.warn("Could not fetch CVE data:", cveError)
  }

  return {
    summary: {
      totalRepositories: repositories.length,
      analyzedRepositories: analyses.filter((a) => a.status === "completed").length,
      failedRepositories: analyses.filter((a) => a.status === "failed").length,
      graphNodes: graph.nodes.length,
      graphEdges: graph.edges.length,
      totalOpenIssues,
      totalCiFindings,
      totalSuggestions,
      totalWorkflows,
      weeklyPushes: dayBuckets.reduce((sum, bucket) => sum + bucket.pushes, 0),
      weeklyCommits: dayBuckets.reduce((sum, bucket) => sum + bucket.commits, 0),
    },
    weeklyPushFrequency: dayBuckets.map((bucket) => ({
      label: bucket.label,
      date: bucket.key,
      pushes: bucket.pushes,
      commits: bucket.commits,
    })),
    recentPushes: recentPushes.slice(0, 8),
    graphComposition: Array.from(graphCompositionMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((left, right) => right.count - left.count),
    languageDistribution: Array.from(languageMap.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6),
    topRepositories,
    cves,
    error: errorMessage,
  }
}

