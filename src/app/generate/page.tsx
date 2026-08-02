import { Suspense } from "react";
import { SpaceBackLink } from "@/components/layout/SpaceBackLink";
import { CardGenerator } from "@/components/CardGenerator";

export default function GeneratePage() {
  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={null}>
        <SpaceBackLink className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-white" />
      </Suspense>
      <CardGenerator />
    </main>
  );
}
