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
  NotebookPen,
  Presentation,
  Sparkles,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { getToolUsageEvents, type ToolUsageEvent } from "@/lib/activity";
import { DASHBOARD_METRICS_UPDATED_EVENT } from "@/lib/dashboard-metrics";
import { DashboardCard, dashboardCardActionClass } from "@/components/dashboard/DashboardCard";

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

function iconFor(toolId: string): LucideIcon {
  if (TOOL_ICON[toolId]) return TOOL_ICON[toolId];
  if (toolId.includes("quiz")) return TOOL_ICON.quiz;
  if (toolId.includes("cv")) return TOOL_ICON.cv;
  if (toolId.includes("syllabus")) return TOOL_ICON.syllabus;
  return Sparkles;
}

function timeLabel(at: number): string {
  const now = new Date();
  const then = new Date(at);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const startOfThen = new Date(then).setHours(0, 0, 0, 0);
  const days = Math.round((startOfToday - startOfThen) / 86_400_000);
  if (days <= 0) {
    return `${String(then.getHours()).padStart(2, "0")}:${String(then.getMinutes()).padStart(2, "0")}`;
  }
  if (days === 1) return "გუშინ";
  return `${then.getDate()}.${String(then.getMonth() + 1).padStart(2, "0")}`;
}

interface DiaryLogProps {
  /** This space's stats page — "ყველა ნახვა" used to always open the
   * student one, even from the abiturient profile. */
  statsHref?: string;
}

export function DiaryLog({ statsHref = "/profile/stats" }: DiaryLogProps = {}) {
  const [events, setEvents] = useState<ToolUsageEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setEvents(
        [...getToolUsageEvents()].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8),
      );
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
    <DashboardCard
      icon={NotebookPen}
      tone="amber"
      title="დღიური"
      action={
        <Link href={statsHref} className={dashboardCardActionClass}>
          ყველა ნახვა →
        </Link>
      }
    >
      {hydrated && events.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          ჯერ აქტივობა არ გაქვს — გახსენი რომელიმე ხელსაწყო და აქ გამოჩნდება.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {events.map((event) => {
            const Icon = iconFor(event.toolId);
            return (
              <li
                key={event.id}
                className="flex h-14 items-center gap-3 rounded-xl border border-[var(--border)] px-3"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                  aria-hidden
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {event.toolTitle}
                  </p>
                  {event.subject ? (
                    <p className="truncate text-xs text-[var(--text-muted)]">{event.subject}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs tabular-nums text-[var(--text-muted)]">
                  {timeLabel(event.timestamp)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
