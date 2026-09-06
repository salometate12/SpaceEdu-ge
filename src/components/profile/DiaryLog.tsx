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
import { getToolUsageEvents, type ToolUsageEvent } from "@/lib/activity";
import { DASHBOARD_METRICS_UPDATED_EVENT } from "@/lib/dashboard-metrics";

const TOOL_META: Record<string, { icon: LucideIcon; color: string }> = {
  quiz: { icon: ListChecks, color: "var(--accent-purple)" },
  "study-plan": { icon: CalendarDays, color: "var(--accent-cyan)" },
  "ai-teacher": { icon: Bot, color: "var(--accent-green)" },
  "lecture-notes": { icon: StickyNote, color: "var(--accent-amber)" },
  journal: { icon: FileText, color: "var(--accent-amber)" },
  presentation: { icon: Presentation, color: "var(--accent-pink)" },
  research: { icon: FileSearch, color: "var(--accent-cyan)" },
  cv: { icon: BriefcaseBusiness, color: "var(--accent-pink)" },
  syllabus: { icon: GraduationCap, color: "var(--accent-purple)" },
  eli5: { icon: Sparkles, color: "var(--accent-green)" },
};

function metaFor(toolId: string) {
  if (TOOL_META[toolId]) return TOOL_META[toolId];
  if (toolId.includes("quiz")) return TOOL_META.quiz;
  if (toolId.includes("cv")) return TOOL_META.cv;
  if (toolId.includes("syllabus")) return TOOL_META.syllabus;
  return { icon: Sparkles, color: "var(--accent-primary)" };
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

export function DiaryLog() {
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
    <section className="dashboard-glass-card relative overflow-hidden rounded-[32px] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="headline text-lg font-black text-[var(--text-primary)] sm:text-xl">დღიური</h3>
        <Link
          href="/profile/stats"
          className="text-xs font-bold text-violet-600 transition-colors hover:text-violet-700 dark:text-cyan-300 dark:hover:text-cyan-200"
        >
          ყველა ნახვა →
        </Link>
      </div>

      {hydrated && events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] p-5 text-center text-sm text-[var(--text-muted)]">
          ჯერ აქტივობა არ გაქვს — გახსენი რომელიმე ხელსაწყო და აქ გამოჩნდება.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {events.map((event) => {
            const { icon: Icon, color } = metaFor(event.toolId);
            return (
              <div
                key={event.id}
                className="flex items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${color}, transparent 85%)`,
                    color,
                  }}
                >
                  <Icon className="h-4 w-4 stroke-[2.25]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {event.toolTitle}
                  </p>
                  {event.subject ? (
                    <p className="truncate text-xs text-[var(--text-muted)]">{event.subject}</p>
                  ) : null}
                </div>
                <span className="mono shrink-0 text-xs font-semibold text-[var(--text-muted)]">
                  {timeLabel(event.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
