import { Suspense } from "react";
import type { Metadata } from "next";
import { JournalPage } from "@/components/lecture-notes/JournalPage";

export const metadata: Metadata = {
  title: "ჟურნალი",
  description: "ჩანაწერები ლექციებზე, დავალებებზე, AI ნოტები და იდეები ერთ ადგილას.",
};

export default function JournalRoute() {
  return (
    <Suspense fallback={<div className="under-site-header min-h-[60vh] bg-[var(--bg-primary)]" aria-busy />}>
      <JournalPage />
    </Suspense>
  );
}
