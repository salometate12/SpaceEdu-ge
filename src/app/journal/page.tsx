import { Suspense } from "react";
import type { Metadata } from "next";
import { JournalPage } from "@/components/lecture-notes/JournalPage";

export const metadata: Metadata = {
  title: "ციფრული ჟურნალი",
  description: "Open Notebook: ლექციები, დავალებები, AI ნოტები და იდეები ერთ რვეულში.",
};

export default function JournalRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-[#C2186B] text-sm font-semibold text-white/80">
          რვეული იხსნება...
        </div>
      }
    >
      <JournalPage />
    </Suspense>
  );
}
