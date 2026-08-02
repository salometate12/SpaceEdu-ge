import Link from "next/link";
import { PricingCards } from "@/components/landing/PricingCards";
import { Button } from "@/components/ui/Button";

export default function PricingPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="headline text-3xl font-bold">Pricing</h1>
        <Link href="/">
          <Button variant="ghost">← Landing</Button>
        </Link>
      </div>
      <PricingCards />
    </main>
  );
}
