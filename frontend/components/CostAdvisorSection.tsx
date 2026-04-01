// ═══════════════════════════════════════════════════════════════════
// CostAdvisorSection.tsx - Server Component
// Fetches data on server, renders UI - no client-side fetch
// ═══════════════════════════════════════════════════════════════════

import { readFileAndAnalyze, type CostAnalysis } from "@/lib/cost-data-server"
import { CostMetricsDisplay } from "@/components/CostMetricsDisplay"

export default async function CostAdvisorSection() {
  const analysis = await readFileAndAnalyze()
  return <CostMetricsDisplay analysis={analysis} />
}