import type { Metadata } from "next";
import Link from "next/link";
import { PricingCards } from "@/components/landing/PricingCards";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "ფასები",
  description:
    "SpaceEdu-ს პაკეტები აბიტურიენტებისა და სტუდენტებისთვის. აირჩიე შენი სივრცის პაკეტი ეროვნული გამოცდებისთვის მოსამზადებლად ან უნივერსიტეტში სასწავლად.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <main className="under-site-header mx-auto min-h-dvh w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="headline text-3xl font-bold">ფასები</h1>
        <Link href="/">
          <Button variant="ghost">← მთავარი</Button>
        </Link>
      </div>
      <PricingCards />
    </main>
  );
}
