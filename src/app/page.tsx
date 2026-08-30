import { AbiturientCenter } from "@/components/landing/AbiturientCenter";
import { AuthErrorNotice } from "@/components/landing/AuthErrorNotice";
import { CTASection } from "@/components/landing/CTASection";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PricingCards } from "@/components/landing/PricingCards";
import { Starfield } from "@/components/landing/Starfield";
import { Testimonials } from "@/components/landing/Testimonials";
import { WhoItsFor } from "@/components/landing/WhoItsFor";

export default function LandingPage() {
  return (
    <div id="hero" className="landing-dark-bg relative min-h-dvh overflow-hidden">
      <Starfield />
      <div className="relative z-10">
        <AuthErrorNotice />
        <Hero />
        <HowItWorks />
        <AbiturientCenter />
        <Features />
        <WhoItsFor />
        <Testimonials />
        <PricingCards />
        <CTASection />
        <LandingFooter />
      </div>
    </div>
  );
}
