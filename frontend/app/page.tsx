import { AnimatedBackground } from "@/components/animated-background"
import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { DashboardShowcase } from "@/components/dashboard-showcase"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <AnimatedBackground />
      <div className="relative z-10">
        <Navigation />
        <HeroSection />
        <DashboardShowcase />
        <Footer />
      </div>
    </main>
  )
}
