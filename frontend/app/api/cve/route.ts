import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-session"
import { listStoredAnalysesForUser } from "@/lib/server/analysis-store"

interface OsvVulnerability {
  id: string
  summary?: string
  details?: string
  aliases?: string[]
  severity?: Array<{
    type: string
    score: string
  }>
  database_specific?: {
    severity?: string
  }
  affected?: Array<{
    package?: {
      name?: string
      ecosystem?: string
    }
    ranges?: Array<{
      type?: string
      events?: Array<Record<string, string>>
    }>
    versions?: string[]
  }>
  references?: Array<{
    type?: string
    url?: string
  }>
  published?: string
  modified?: string
}

interface OsvQueryResponse {
  vulns?: OsvVulnerability[]
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function extractSeverity(vuln: OsvVulnerability): string {
  // Try database_specific severity first
  if (vuln.database_specific?.severity) {
    return vuln.database_specific.severity
  }

  // Try CVSS scores
  if (vuln.severity && vuln.severity.length > 0) {
    for (const sev of vuln.severity) {
      if (sev.type === "CVSS_V3") {
        const score = parseFloat(sev.score)
        if (score >= 9.0) return "Critical"
        if (score >= 7.0) return "High"
        if (score >= 4.0) return "Medium"
        return "Low"
      }
    }
  }

  // Check for CVSSv3 score in aliases or summary
  return "Medium"
}

function extractAffectedVersionRange(vuln: OsvVulnerability, packageName: string): string {
  if (!vuln.affected) return "unknown"
  
  for (const affected of vuln.affected) {
    if (affected.package?.name !== packageName) continue
    
    if (affected.ranges && affected.ranges.length > 0) {
      for (const range of affected.ranges) {
        if (!range.events) continue
        const introduced = range.events.find(e => e.introduced)?.introduced
        const fixed = range.events.find(e => e.fixed)?.fixed
        
        if (introduced && fixed) {
          return `>=${introduced}, <${fixed}`
        } else if (fixed) {
          return `<${fixed}`
        } else if (introduced && introduced !== "0") {
          return `>=${introduced}`
        }
      }
    }
    
    if (affected.versions && affected.versions.length > 0) {
      return affected.versions.slice(0, 3).join(", ") + (affected.versions.length > 3 ? "..." : "")
    }
  }
  
  return "all versions"
}

function getCveLink(vuln: OsvVulnerability): string {
  // Prefer NVD link for CVE IDs
  const cveId = vuln.aliases?.find(a => a.startsWith("CVE-")) || (vuln.id.startsWith("CVE-") ? vuln.id : null)
  if (cveId) {
    return `https://nvd.nist.gov/vuln/detail/${cveId}`
  }
  
  // Use ADVISORY reference
  if (vuln.references) {
    const advisory = vuln.references.find(r => r.type === "ADVISORY" && r.url)
    if (advisory?.url) return advisory.url
    
    const web = vuln.references.find(r => r.type === "WEB" && r.url)
    if (web?.url) return web.url
  }
  
  return `https://osv.dev/vulnerability/${vuln.id}`
}

async function queryOsvForPackage(packageName: string, version: string): Promise<OsvVulnerability[]> {
  try {
    // Clean the version string - remove semver prefixes like ^ ~ >= etc
    const cleanVersion = version.replace(/^[\^~>=<]+/, "").trim()
    
    const response = await fetch("https://api.osv.dev/v1/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        package: {
          name: packageName,
          ecosystem: "npm",
        },
        version: cleanVersion,
      }),
    })

    if (!response.ok) return []

    const data = (await response.json()) as OsvQueryResponse
    return data.vulns || []
  } catch {
    return []
  }
}

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const analyses = await listStoredAnalysesForUser(session.user.id)
    const completedAnalyses = analyses.filter((a) => a.status === "completed")

    if (completedAnalyses.length === 0) {
      return NextResponse.json({
        cves: [],
        message: "No analyzed repositories found. Please analyze some repositories first.",
        analyzedRepositories: 0,
        totalDependenciesChecked: 0,
      })
    }

    // Collect all dependencies from analyzed repositories
    const dependencyMap = new Map<string, { version: string; repos: string[] }>()
    
    for (const analysis of completedAnalyses) {
      const deps = safeJsonParse<Record<string, string>>(
        (analysis as any).dependenciesJson,
        {}
      )
      
      for (const [name, version] of Object.entries(deps)) {
        const existing = dependencyMap.get(name)
        if (existing) {
          if (!existing.repos.includes(analysis.repoFullName)) {
            existing.repos.push(analysis.repoFullName)
          }
        } else {
          dependencyMap.set(name, { version, repos: [analysis.repoFullName] })
        }
      }
    }

    if (dependencyMap.size === 0) {
      return NextResponse.json({
        cves: [],
        message: "No dependencies found in analyzed repositories. Make sure the repositories have a package.json file.",
        analyzedRepositories: completedAnalyses.length,
        totalDependenciesChecked: 0,
      })
    }

    // Query OSV.dev for vulnerabilities - batch check top dependencies
    // Limit to 30 packages to avoid excessive API calls
    const packagesToCheck = Array.from(dependencyMap.entries()).slice(0, 30)
    
    const cveResults: Array<{
      id: string
      package: string
      version: string
      severity: string
      description: string
      link: string
      published: string
      repos: string[]
    }> = []

    const seenCves = new Set<string>()

    // Query in parallel batches of 5
    const batchSize = 5
    for (let i = 0; i < packagesToCheck.length; i += batchSize) {
      const batch = packagesToCheck.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(async ([name, { version, repos }]) => {
          const vulns = await queryOsvForPackage(name, version)
          return { name, version, repos, vulns }
        })
      )

      for (const { name, version, repos, vulns } of results) {
        for (const vuln of vulns) {
          const cveId = vuln.aliases?.find(a => a.startsWith("CVE-")) || vuln.id
          if (seenCves.has(cveId)) continue
          seenCves.add(cveId)

          cveResults.push({
            id: cveId,
            package: name,
            version: extractAffectedVersionRange(vuln, name),
            severity: extractSeverity(vuln),
            description: vuln.summary || vuln.details?.slice(0, 200) || "No description available",
            link: getCveLink(vuln),
            published: vuln.published || vuln.modified || new Date().toISOString().split("T")[0],
            repos,
          })
        }
      }
    }

    // Sort by severity
    const severityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 }
    cveResults.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4))

    return NextResponse.json({
      cves: cveResults.slice(0, 50),
      analyzedRepositories: completedAnalyses.length,
      totalDependenciesChecked: dependencyMap.size,
    })
  } catch (error) {
    console.error("Error fetching CVEs:", error)
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : "Failed to fetch CVE information",
      },
      { status: 500 }
    )
  }
}