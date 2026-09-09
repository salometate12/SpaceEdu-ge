import { AbiturientCenter } from "@/components/landing/AbiturientCenter";
import { AuthErrorNotice } from "@/components/landing/AuthErrorNotice";
import { CTASection } from "@/components/landing/CTASection";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { NotebookSheet } from "@/components/landing/notebook/NotebookSheet";
import { PricingCards } from "@/components/landing/PricingCards";
import { Starfield } from "@/components/landing/Starfield";
import { Testimonials } from "@/components/landing/Testimonials";
import { WhoItsFor } from "@/components/landing/WhoItsFor";

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.spaceedu.ge/#organization",
      name: "SpaceEdu",
      url: "https://www.spaceedu.ge",
      logo: "https://www.spaceedu.ge/favicon.ico",
      description:
        "SpaceEdu — ქართული AI სასწავლო პლატფორმა აბიტურიენტებისთვის, სტუდენტებისთვის და მოსწავლეებისთვის.",
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
        "AI-ით მართული სასწავლო გეგმა, ქვიზები, კონსპექტები და AI მასწავლებელი — ეროვნული გამოცდებისა და უნივერსიტეტის საგნებისთვის.",
      areaServed: {
        "@type": "Country",
        name: "Georgia",
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <div id="hero" className="landing-dark-bg relative min-h-dvh overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <Starfield />
      <div className="relative z-10">
        <AuthErrorNotice />
        {/* The landing is a stack of notebook sheets rather than one long
            page. The dark ground stays visible between them, which is what
            gives every section change its drawn edge; the header pill and
            the footer are the chrome the stack sits on, so they stay dark
            in both themes. */}
        <div className="space-y-4 px-3 pb-6 sm:space-y-5 sm:px-5 sm:pb-8 lg:px-8">
          <NotebookSheet>
            <Hero />
            <HowItWorks />
          </NotebookSheet>
          <NotebookSheet>
            <AbiturientCenter />
            <Features />
          </NotebookSheet>
          <NotebookSheet>
            <WhoItsFor />
            <Testimonials />
          </NotebookSheet>
          <NotebookSheet>
            <PricingCards />
            <CTASection />
          </NotebookSheet>
        </div>
        <LandingFooter />
      </div>
    </div>
  );
}
