import type { Metadata } from "next";
import Link from "next/link";
import { PricingCards } from "@/components/landing/PricingCards";
import { Button } from "@/components/ui/Button";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "ფასები",
  description:
    "SpaceEdu-ს პაკეტები აბიტურიენტებისა და სტუდენტებისთვის. აირჩიე შენი სივრცის პაკეტი ეროვნული გამოცდებისთვის მოსამზადებლად ან უნივერსიტეტში სასწავლად.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <main className="landing under-site-header min-h-dvh w-full px-3 py-10 sm:px-5 lg:px-8">
      <div className="mx-auto w-full max-w-[1176px]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="headline text-3xl font-bold">ფასები</h1>
        <Link href="/">
          <Button variant="ghost">← მთავარი</Button>
        </Link>
      </div>
      <PricingCards />
      </div>
    </main>
  );
}
