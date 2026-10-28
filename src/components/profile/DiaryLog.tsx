"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  FileSearch,
  FileText,
  GraduationCap,
  ListChecks,
  Presentation,
  Sparkles,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { getToolUsageEvents } from "@/lib/activity";
import { DASHBOARD_METRICS_UPDATED_EVENT } from "@/lib/dashboard-metrics";
import { buildDiary, type DiaryDay } from "@/lib/diary";

const TOOL_ICON: Record<string, LucideIcon> = {
  quiz: ListChecks,
  "study-plan": CalendarDays,
  "ai-teacher": Bot,
  "lecture-notes": StickyNote,
  journal: FileText,
  presentation: Presentation,
  research: FileSearch,
  cv: BriefcaseBusiness,
  syllabus: GraduationCap,
  eli5: Sparkles,
};

type ToolGroup = "plan" | "ai" | "practice";

/** The logo's three books: planning pink, explaining yellow, practising green. */
const GROUP_TILE: Record<ToolGroup, string> = {
  plan: "bg-[#fdf2f8] text-[#db2777] dark:bg-[rgba(236,72,153,0.14)] dark:text-[#f472b6]",
  ai: "bg-[#fefce8] text-[#a16207] dark:bg-[rgba(250,204,21,0.12)] dark:text-[#fde68a]",
  practice: "bg-[#f0fdf4] text-[#15803d] dark:bg-[rgba(74,222,128,0.12)] dark:text-[#86efac]",
};

function groupFor(toolId: string): ToolGroup {
  if (/quiz|presentation|cv|deck/.test(toolId)) return "practice";
  if (/ai-teacher|eli5|research|material/.test(toolId)) return "ai";
  return "plan";
}

function iconFor(toolId: string): LucideIcon {
  if (TOOL_ICON[toolId]) return TOOL_ICON[toolId];
  if (toolId.includes("quiz")) return TOOL_ICON.quiz;
  if (toolId.includes("cv")) return TOOL_ICON.cv;
  if (toolId.includes("syllabus")) return TOOL_ICON.syllabus;
  return Sparkles;
}

function timeLabel(at: number): string {
  const then = new Date(at);
  return `${String(then.getHours()).padStart(2, "0")}:${String(then.getMinutes()).padStart(2, "0")}`;
}

interface DiaryLogProps {
  /** This space's stats page, for „ყველა“. */
  statsHref?: string;
}

/** The latest activity, by day, each tool once per subject per day. */
export function DiaryLog({ statsHref = "/profile/stats" }: DiaryLogProps = {}) {
  const [days, setDays] = useState<DiaryDay[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setDays(buildDiary(getToolUsageEvents()));
      setHydrated(true);
    };
    refresh();
    window.addEventListener(DASHBOARD_METRICS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(DASHBOARD_METRICS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <section aria-label="ბოლო აქტივობა" className="ps-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-[var(--ps-title)]">ბოლო აქტივობა</h2>
        <Link
          href={statsHref}
          className="ps-focus rounded-sm text-[13.5px] font-semibold text-[#be185d] hover:underline dark:text-[#f9a8d4]"
        >
          ყველა →
        </Link>
      </div>

      {hydrated && days.length === 0 ? (
        <p className="mt-3 text-[14.5px] text-[var(--ps-muted)]">
          ჯერ აქტივობა არ გაქვს. გახსენი რომელიმე ხელსაწყო და აქ გამოჩნდება.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {days.map((day) => (
            <div key={day.label}>
              <h3 className="px-2 pb-1 text-[12.5px] font-semibold text-[var(--ps-muted)]">{day.label}</h3>
              <ul>
                {day.entries.map((entry) => {
                  const Icon = iconFor(entry.toolId);
                  const sub = [entry.subject, entry.count > 1 ? `${entry.count}-ჯერ` : null].filter(Boolean).join(" · ");
                  return (
                    <li key={entry.key} className="flex items-center gap-3 rounded-[14px] px-2 py-2.5">
                      <span
                        className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] ${GROUP_TILE[groupFor(entry.toolId)]}`}
                        aria-hidden
                      >
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-semibold text-[var(--ps-title)]">{entry.title}</p>
                        {sub ? <p className="truncate text-[13px] text-[var(--ps-muted)]">{sub}</p> : null}
                      </div>
                      <span className="shrink-0 text-[13px] text-[var(--ps-muted)]">{timeLabel(entry.at)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
