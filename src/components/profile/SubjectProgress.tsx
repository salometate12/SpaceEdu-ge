"use client";

import { useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import {
  computeSubjectProgress,
  lastActivityLabel,
  type SubjectProgressStat,
} from "@/lib/subject-progress";
import { SUBJECT_TAG_COLORS } from "@/lib/semester-subjects";
import { DASHBOARD_METRICS_UPDATED_EVENT } from "@/lib/dashboard-metrics";

const BAR_COLORS = [
  "var(--accent-purple)",
  "var(--accent-cyan)",
  "var(--accent-amber)",
  "var(--accent-green)",
  "var(--accent-pink)",
  "var(--accent-primary)",
];

export function SubjectProgress() {
  const [subjects, setSubjects] = useState<SubjectProgressStat[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setSubjects(computeSubjectProgress().subjects);
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
      <div className="mb-5 flex items-center justify-between gap-2">
        <h3 className="headline text-lg font-black text-[var(--text-primary)] sm:text-xl">
          საგნობრივი პროგრესი
        </h3>
        {subjects.length > 0 && (
          <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-bold text-[var(--text-muted)]">
            {subjects.length} საგანი
          </span>
        )}
      </div>

      {hydrated && subjects.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[var(--border)] p-6 text-center">
          <BookMarked className="mx-auto h-6 w-6 text-[var(--text-muted)]" strokeWidth={1.75} />
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
            ჯერ საგნები არ დაგიმატებია
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[var(--text-muted)]">
            დაამატე სემესტრის საგნები დეშბორდზე — შემდეგ აქ იხილავ პროგრესს ქვიზებისა და AI ხელსაწყოების მიხედვით.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {subjects.map((subject, index) => {
            const color = BAR_COLORS[index % BAR_COLORS.length];
            const tag = SUBJECT_TAG_COLORS[index % SUBJECT_TAG_COLORS.length];
            return (
              <div key={subject.name}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-2 text-sm font-bold text-[var(--text-primary)] sm:text-base">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black"
                      style={{ background: tag.bg, color: tag.text }}
                      aria-hidden
                    >
                      {subject.name.charAt(0)}
                    </span>
                    <span className="truncate">{subject.name}</span>
                  </p>
                  <span className="mono shrink-0 text-sm font-black" style={{ color }}>
                    {subject.progress}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[var(--border)]">
                  <div
                    className="animated-progress h-full rounded-full transition-all"
                    style={{ width: `${subject.progress}%`, backgroundColor: color }}
                  />
                </div>
                <p className="mt-1.5 text-xs font-medium text-[var(--text-muted)]">
                  {subject.quizzes > 0
                    ? `${subject.quizzes} ქვიზი${subject.accuracy !== null ? ` · ${subject.accuracy}% სიზუსტე` : ""}`
                    : `${subject.activityCount} აქტივობა`}
                  {" · "}
                  {lastActivityLabel(subject.lastActivityAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
