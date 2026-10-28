import { AbiturientCenter } from "@/components/landing/AbiturientCenter";
import "@/components/landing/landing.css";
import { AuthErrorNotice } from "@/components/landing/AuthErrorNotice";
import { CTASection } from "@/components/landing/CTASection";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { PricingCards } from "@/components/landing/PricingCards";
import { WhoItsFor } from "@/components/landing/WhoItsFor";
import { WhySpaceEdu } from "@/components/landing/WhySpaceEdu";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.spaceedu.ge/#organization",
      name: "SpaceEdu",
      url: "https://www.spaceedu.ge",
      logo: "https://www.spaceedu.ge/icons/icon-512x512.png",
      description:
        "SpaceEdu ქართული AI სასწავლო პლატფორმაა აბიტურიენტებისთვის, სტუდენტებისთვის და მოსწავლეებისთვის.",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.spaceedu.ge/#website",
      url: "https://www.spaceedu.ge",
      name: "SpaceEdu",
      publisher: { "@id": "https://www.spaceedu.ge/#organization" },
      inLanguage: "ka-GE",
    },
    {
      "@type": "EducationalOrganization",
      name: "SpaceEdu",
      url: "https://www.spaceedu.ge",
      description:
        "სასწავლო გეგმა, ქვიზები, კონსპექტები და AI მასწავლებელი ეროვნული გამოცდებისა და უნივერსიტეტის საგნებისთვის.",
      areaServed: {
        "@type": "Country",
        name: "Georgia",
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <div id="hero" className="landing under-site-header relative min-h-dvh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <AuthErrorNotice />
      {/* The hero and the prices are notebook sheets; the sections between
          them are plain cards on the page. */}
      <div className="mx-auto w-full max-w-[1240px] px-3 pb-14 pt-2 sm:px-5 sm:pb-20 lg:px-8">
        <Hero />
        <HowItWorks />
        <AbiturientCenter />
        <Features />
        <WhoItsFor />
        <WhySpaceEdu />
        <div className="mt-6 space-y-14 sm:mt-10 sm:space-y-20">
          <PricingCards />
          <CTASection />
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
