"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  Link2,
} from "lucide-react";
import type { HistorySource } from "@/lib/history-sources";
import { historyAssistantUi } from "@/lib/history-assistant-ui";

interface SourcesPanelProps {
  sources: HistorySource[];
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function SourcesPanel({ sources }: SourcesPanelProps) {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(true);

  if (sources.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white px-4 py-3 text-left shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:border-amber-900/50 dark:from-amber-950/40 dark:to-zinc-900 sm:w-auto sm:min-w-[220px]"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <Link2 className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {historyAssistantUi.sourcesButton}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {sources.length} {historyAssistantUi.sourcesCount}
            </span>
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-amber-600" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-amber-600" />
        )}
      </button>

      {open && (
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {historyAssistantUi.sourcesHint}
            </p>
            <button
              type="button"
              onClick={() => setCompact((v) => !v)}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
            >
              {compact
                ? historyAssistantUi.sourcesExpand
                : historyAssistantUi.sourcesCompact}
            </button>
          </div>

          <ul className="max-h-72 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
            {sources.map((source, index) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-amber-50/60 dark:hover:bg-amber-950/20"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 group-hover:bg-amber-100 group-hover:text-amber-700 dark:bg-zinc-800 dark:group-hover:bg-amber-900/40 dark:group-hover:text-amber-300">
                    <Globe className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                        {index + 1}
                      </span>
                      <span className="truncate text-xs text-zinc-400">
                        {source.domain}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm font-medium text-zinc-800 group-hover:text-amber-800 dark:text-zinc-200 dark:group-hover:text-amber-200">
                      {compact
                        ? truncate(source.title, 56)
                        : source.title}
                    </span>
                    {!compact && (
                      <span className="mt-1 block truncate text-xs text-zinc-400 group-hover:text-amber-600/80">
                        {source.url}
                      </span>
                    )}
                  </span>
                  <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-300 transition-colors group-hover:text-amber-600" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
