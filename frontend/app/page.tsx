import { PrismBackground } from "@/components/PrismBackground"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { ChatbotSection } from "@/components/chatbot-section"
import { KnowledgeGraph } from "@/components/knowledge-graph"
import { PreDeployWarRoom } from "@/components/pre-deploy-war-room"
import { GitHubIntegration } from "@/components/github-integration"
import { RepositorySyncing } from "@/components/repository-syncing"
import { RealTimeMetrics } from "@/components/real-time-metrics"
import { TeamSection } from "@/components/team-section"
import { Footer } from "@/components/footer"
import { ChatbotWidget } from "@/components/chatbot-widget"
import { ProblemSection } from "@/components/problem-section"
import { SolutionSection } from "@/components/solution-section"
import { FeatureCardsDeck } from "@/components/feature-cards-deck"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#080c10] text-white">
      <PrismBackground />
      <div className="relative z-10">
        <Navigation />
        <div className="pt-16">
          <HeroSection />
          {/* 1. Problem Section */}
          <ProblemSection />
          {/* 2. Solution Section */}
          <SolutionSection />
          {/* 3. The 6 Detailed Features - exactly once, in this exact order */}
          <ChatbotSection />
          <KnowledgeGraph />
          <PreDeployWarRoom />
          <GitHubIntegration />
          <RepositorySyncing />
          <RealTimeMetrics />
          {/* 4. The Feature Cards Deck */}
          <FeatureCardsDeck />
          <TeamSection />
          <Footer />
        </div>
      </div>
      <ChatbotWidget />
    </main>
  )
}
