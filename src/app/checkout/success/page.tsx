import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccess } from "@/components/checkout/CheckoutSuccess";

export const metadata: Metadata = {
  title: "გადახდა წარმატებულია",
  alternates: { canonical: "/checkout/success" },
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessRoute() {
  return (
    <Suspense fallback={null}>
      <CheckoutSuccess />
    </Suspense>
  );
}
