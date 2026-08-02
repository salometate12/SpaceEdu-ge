"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ka } from "@/lib/i18n";
import type { Conspectus } from "@/lib/conspectus-storage";
import { ConspectusViewer } from "@/components/conspectus/ConspectusViewer";

interface ConspectusReaderProps {
  conspectus: Conspectus;
}

export function ConspectusReader({ conspectus }: ConspectusReaderProps) {
  const leftPanel = (
    <div className="space-y-4">
      <Link
        href="/generate"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-violet-600 dark:text-zinc-400 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        {ka.conspectus.back}
      </Link>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          კონსპექტი
        </p>
        <h1 className="mt-1 text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-50">
          {conspectus.title}
        </h1>
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
    <ConspectusViewer
      content={conspectus.content}
      leftPanel={leftPanel}
      downloadFilename={conspectus.title}
      accent="violet"
    />
    </div>
  );
}
