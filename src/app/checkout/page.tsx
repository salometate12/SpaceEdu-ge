import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";

export const metadata: Metadata = {
  title: "გადახდა",
  description:
    "აირჩიე SpaceEdu-ს პაკეტი და გადაიხადე შენი ბანკის დაცულ გადახდის გვერდზე.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};

export default function CheckoutRoute() {
  return (
    <Suspense fallback={null}>
      <CheckoutPage />
    </Suspense>
  );
}
