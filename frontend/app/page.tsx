import { AnimatedBackground } from "@/components/animated-background"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { ChatbotSection } from "@/components/chatbot-section"
import { KnowledgeGraph } from "@/components/knowledge-graph"
import { DashboardShowcase } from "@/components/dashboard-showcase"
import { TeamSection } from "@/components/team-section"
import { Footer } from "@/components/footer"
import { ChatbotWidget } from "@/components/chatbot-widget"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navigation />
        <HeroSection />
        <ChatbotSection />
        <KnowledgeGraph />
        <DashboardShowcase />
        <TeamSection />
        <Footer />
      </div>
      <ChatbotWidget />
    </main>
  )
}
