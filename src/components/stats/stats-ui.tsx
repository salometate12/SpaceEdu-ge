"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { ACTIVITY_LOG_UPDATED_EVENT, readActivityLog, type ActivityEvent, type StatsSpace, type ToolKey } from "@/lib/activity-log";
import { RANGE_LABEL, WEEKDAY_LONG, type HeatCell, type StatsRange } from "@/lib/stats/common";
import { MONTH_LONG } from "@/lib/study-day";

/** The log, read on the client and kept fresh: on writes here, on sync from another device, on return to the tab. */
export function useActivityLog(): ActivityEvent[] | null {
  const [log, setLog] = useState<ActivityEvent[] | null>(null);
  useEffect(() => {
    const read = () => setLog(readActivityLog());
    read();
    window.addEventListener(ACTIVITY_LOG_UPDATED_EVENT, read);
    window.addEventListener("storage", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener(ACTIVITY_LOG_UPDATED_EVENT, read);
      window.removeEventListener("storage", read);
      window.removeEventListener("focus", read);
    };
  }, []);
  return log;
}

const SPACE_CHIP: Record<StatsSpace, { label: string; className: string; dot: string }> = {
  student: {
    label: "სტუდენტის სივრცე",
    className: "bg-[#fdf2f8] text-[#9d174d] dark:bg-[rgba(236,72,153,0.14)] dark:text-[#f9a8d4]",
    dot: "bg-[#ec4899]",
  },
  abiturient: {
    label: "აბიტურიენტის სივრცე",
    className: "bg-[#fefce8] text-[#854d0e] dark:bg-[rgba(250,204,21,0.12)] dark:text-[#fde68a]",
    dot: "bg-[#facc15]",
  },
};

export function SpaceChip({ space }: { space: StatsSpace }) {
  const chip = SPACE_CHIP[space];
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold ${chip.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${chip.dot}`} aria-hidden />
      {chip.label}
    </span>
  );
}

/** „სტატისტიკა“ + the space + the period switch (full width on a phone). */
export function StatsHeader({
  space,
  ranges,
  range,
  onRange,
}: {
  space: StatsSpace;
  ranges: StatsRange[];
  range: StatsRange;
  onRange: (range: StatsRange) => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col items-start gap-2">
        <h1 className="hidden text-[28px] font-bold leading-tight tracking-tight text-[var(--ps-title)] md:block">სტატისტიკა</h1>
        <SpaceChip space={space} />
      </div>
      <div role="radiogroup" aria-label="პერიოდი" className="grid h-11 grid-cols-3 rounded-full bg-[var(--ps-soft)] p-1 md:inline-grid md:w-auto">
        {ranges.map((option) => {
          const active = option === range;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onRange(option)}
              className={`ps-focus rounded-full px-4 text-[13.5px] font-semibold transition-colors ${
                active
                  ? "bg-[var(--ps-card)] text-[var(--ps-title)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                  : "text-[var(--ps-muted)] hover:text-[var(--ps-title)]"
              }`}
            >
              {RANGE_LABEL[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** One number card. `empty` replaces the number with a line of text and a link. */
export function Metric({
  label,
  value,
  sub,
  good = false,
  empty,
}: {
  label: string;
  value?: string;
  sub?: string;
  good?: boolean;
  empty?: { text: string; href: string; cta: string };
}) {
  return (
    <article className="ps-card flex min-h-[124px] flex-col p-4 sm:p-5">
      <h2 className="text-[13.5px] font-medium text-[var(--ps-muted)]">{label}</h2>
      {empty ? (
        <>
          <p className="mt-2 text-[14px] leading-snug text-[var(--ps-text)]">{empty.text}</p>
          <Link href={empty.href} className="ps-focus mt-auto pt-2 text-[13px] font-semibold text-[#be185d] hover:underline dark:text-[#f9a8d4]">
            {empty.cta} →
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 text-[26px] font-bold leading-none text-[var(--ps-title)] sm:text-[30px]">{value}</p>
          {sub ? (
            <p className={`mt-2 text-[13px] leading-snug ${good ? "font-semibold text-[#16a34a] dark:text-[#86efac]" : "text-[var(--ps-muted)]"}`}>
              {sub}
            </p>
          ) : null}
        </>
      )}
    </article>
  );
}

/** A titled card on the stats page. */
export function Block({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="ps-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-[var(--ps-title)]">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Nothing to show yet: a short line and where to start. */
export function EmptyNote({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-dashed border-[var(--ps-field-border)] px-4 py-4">
      <p className="text-[14.5px] text-[var(--ps-text)]">{text}</p>
      <Link
        href={href}
        className="ps-focus inline-flex items-center gap-1 rounded-sm text-[13.5px] font-semibold text-[#be185d] hover:underline dark:text-[#f9a8d4]"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}

/** A horizontal bar with its label and value. */
export function BarRow({ label, value, max, display, fill }: { label: string; value: number; max: number; display: string; fill: string }) {
  const width = max > 0 ? Math.max(value > 0 ? 3 : 0, Math.round((value / max) * 100)) : 0;
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-[14.5px] font-semibold text-[var(--ps-title)]" title={label}>
          {label}
        </span>
        <span className={`shrink-0 text-[13px] font-semibold ${value > 0 ? "text-[var(--ps-title)]" : "text-[var(--ps-muted)]"}`}>{display}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#f1efeb] dark:bg-[#27272f]" aria-hidden>
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: fill }} />
      </div>
    </li>
  );
}

const HEAT_LIGHT = ["#f1efeb", "#fce7f3", "#f9a8d4", "#ec4899", "#be185d"];
const HEAT_DARK = ["#1f1f27", "#4a1d34", "#9d174d", "#db2777", "#f472b6"];

function heatColor(level: number): string {
  return `light-dark(${HEAT_LIGHT[level]}, ${HEAT_DARK[level]})`;
}

function cellLabel(cell: HeatCell): string {
  const [, m, d] = cell.date.split("-").map(Number);
  return `${d} ${MONTH_LONG[m - 1]} · ${cell.count} აქტივობა`;
}

/**
 * The activity map: 12 weeks on wide screens, the last 8 on a phone, five
 * steps of pink, a legend, and the best streak and busiest weekday beside it.
 */
export function ActivityMap({ heatmap, best, busiest }: { heatmap: HeatCell[][]; best: number; busiest: number | null }) {
  const hiddenOnPhone = Math.max(0, heatmap.length - 8);
  return (
    <Block title="აქტიურობის რუკა">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex gap-1.5 [color-scheme:light] dark:[color-scheme:dark]" role="img" aria-label="ბოლო კვირების აქტიურობა">
            {heatmap.map((week, index) => (
              <div key={week[0].date} className={`flex flex-1 flex-col gap-1.5 ${index < hiddenOnPhone ? "max-md:hidden" : ""}`}>
                {week.map((cell) => (
                  <span
                    key={cell.date}
                    title={cell.future ? undefined : cellLabel(cell)}
                    className={`aspect-square w-full max-w-7 rounded-[5px] ${cell.future ? "opacity-0" : ""}`}
                    style={{ background: heatColor(cell.level) }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[12px] text-[var(--ps-muted)] [color-scheme:light] dark:[color-scheme:dark]">
            ნაკლები
            {HEAT_LIGHT.map((_, level) => (
              <span key={level} className="h-3 w-3 rounded-[3px]" style={{ background: heatColor(level) }} aria-hidden />
            ))}
            მეტი
          </div>
        </div>
        <dl className="grid shrink-0 grid-cols-2 gap-3 lg:w-[190px] lg:grid-cols-1">
          <div className="rounded-[16px] bg-[var(--ps-soft)] p-3.5">
            <dt className="text-[12.5px] text-[var(--ps-muted)]">საუკეთესო სტრიქი</dt>
            <dd className="mt-1 text-[17px] font-bold text-[var(--ps-title)]">{best > 0 ? `${best} დღე` : "ჯერ არ არის"}</dd>
          </div>
          <div className="rounded-[16px] bg-[var(--ps-soft)] p-3.5">
            <dt className="text-[12.5px] text-[var(--ps-muted)]">ყველაზე აქტიური დღე</dt>
            <dd className="mt-1 text-[17px] font-bold text-[var(--ps-title)]">{busiest === null ? "ჯერ არ არის" : WEEKDAY_LONG[busiest]}</dd>
          </div>
        </dl>
      </div>
    </Block>
  );
}

export const TOOL_LABEL: Record<ToolKey, string> = {
  ai_teacher: "AI მასწავლებელი",
  quiz: "ქვიზი",
  study_plan: "სასწავლო გეგმა",
  presentation: "პრეზენტაცია",
  material_analysis: "მასალის ანალიზი",
  eli5: "მარტივად ახსნა",
  cv: "CV",
  syllabus: "სილაბუსი",
  journal: "ჟურნალი",
  lecture_notes: "ლექციის ნოტები",
  conspectus: "კონსპექტი",
  open_grader: "ღია დავალებები",
  practice: "სავარჯიშოები",
  other: "სხვა",
};

/** The logo's three books: planning pink, explaining yellow, practising green. */
export function toolFill(tool: ToolKey): string {
  if (tool === "ai_teacher" || tool === "eli5" || tool === "material_analysis" || tool === "conspectus") return "#eab308";
  if (tool === "quiz" || tool === "presentation" || tool === "cv" || tool === "practice" || tool === "open_grader") return "#22c55e";
  return "#ec4899";
}
