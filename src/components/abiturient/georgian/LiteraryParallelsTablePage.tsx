"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, GitMerge } from "lucide-react";
import {
  LITERARY_PARALLELS_ACCORDION_ROWS,
  LIT_PARALLELS_HREF,
} from "@/lib/georgian-lit-parallels-table";

interface LiteraryParallelsTablePageProps {
  backHref?: string;
  backLabel?: string;
}

function AccordionRowItem({
  index,
  expanded,
  onToggle,
  title,
  issueHeadline,
  parallel,
  modern,
}: {
  index: number;
  expanded: boolean;
  onToggle: (index: number) => void;
  title: string;
  issueHeadline: string;
  parallel: string;
  modern: string;
}) {
  const panelId = `lit-parallel-panel-${index}`;

  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button
        type="button"
        onClick={() => onToggle(index)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-all duration-300 sm:px-6 sm:py-4.5 ${
          expanded ? "bg-purple-500/[0.03]" : "hover:bg-purple-500/[0.02]"
        }`}
      >
        <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-white sm:text-[15px]">
          {title}
        </span>
        <span className="hidden min-w-0 max-w-md flex-[1.2] truncate text-xs text-gray-400 sm:block">
          {issueHeadline}
        </span>
        <span className="shrink-0 sm:hidden">
          <span className="line-clamp-2 max-w-[140px] text-[11px] leading-relaxed text-gray-500">
            {issueHeadline}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 stroke-[1.5] text-gray-500 transition-transform duration-300 ${
            expanded ? "rotate-180 text-purple-400/80" : ""
          }`}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        role="region"
        aria-hidden={!expanded}
        className={`grid transition-all duration-300 ease-out ${
          expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-b border-white/[0.04] bg-white/[0.02] p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="min-w-0">
                <span className="mb-2 inline-block rounded-md border border-purple-500/15 bg-purple-500/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-400/90">
                  ლიტერატურული პარალელი
                </span>
                <p className="break-words text-sm leading-relaxed text-purple-200/90">
                  {parallel}
                </p>
              </div>
              <div className="min-w-0">
                <span className="mb-2 inline-block rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  თანამედროვე კონტექსტი & არგუმენტი
                </span>
                <p className="break-words text-sm leading-relaxed text-gray-400">
                  {modern}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LiteraryParallelsTablePage({
  backHref: backHrefProp,
  backLabel: backLabelProp,
}: LiteraryParallelsTablePageProps = {}) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const backFromQuery =
    from === "hub"
      ? { href: "/subject/georgian", label: "საგნის სფეისზე დაბრუნება" }
      : from === "space"
        ? { href: "/subject/georgian/space", label: "საგამოცდო სივრცეზე დაბრუნება" }
        : null;

  const backHref = backHrefProp ?? backFromQuery?.href ?? "/lit-assistant";
  const backLabel =
    backLabelProp ?? backFromQuery?.label ?? "ლიტერატურის ასისტენტზე დაბრუნება";

  const toggleRow = useCallback((index: number) => {
    setExpandedRow((current) => (current === index ? null : index));
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#09090b] p-8 md:p-12">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 stroke-[1.5]" />
          {backLabel}
        </Link>

        <header className="mb-8 flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
            <GitMerge className="h-6 w-6 stroke-[1.5] text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400/90">
              არგუმენტების ბანკი
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              ლიტერატურული პარალელები
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
              {LITERARY_PARALLELS_ACCORDION_ROWS.length} თემატური ჩანაწერი — დააკლიკე რიგს პარალელისა და
              თანამედროვე არგუმენტის სანახავად.
            </p>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#121214]/30 backdrop-blur-md">
          <div
            className="hidden border-b border-white/[0.06] bg-white/[0.02] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:grid sm:grid-cols-[1fr_1.2fr_2.5rem] sm:gap-4"
            aria-hidden
          >
            <span>ნაწარმოები / ავტორი</span>
            <span>საგამოცდო თემა</span>
            <span className="sr-only">გახსნა</span>
          </div>

          <div role="list" aria-label="ლიტერატურული პარალელები">
            {LITERARY_PARALLELS_ACCORDION_ROWS.map((row, index) => (
              <AccordionRowItem
                key={row.id}
                index={index}
                expanded={expandedRow === index}
                onToggle={toggleRow}
                title={row.title}
                issueHeadline={row.issueHeadline}
                parallel={row.parallel}
                modern={row.modern}
              />
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-zinc-600">
          მონაცემები: ქართულის თემები ეროვნულებისთვის — სრული, გაშლილი მატრიცა
        </p>
      </div>
    </div>
  );
}

export { LIT_PARALLELS_HREF };
