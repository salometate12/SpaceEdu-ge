"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import {
  computeSubjectProgress,
  lastActivityLabel,
  type SubjectProgressStat,
} from "@/lib/subject-progress";
import { DASHBOARD_METRICS_UPDATED_EVENT } from "@/lib/dashboard-metrics";
import { DashboardCard } from "@/components/dashboard/DashboardCard";

interface SubjectProgressProps {
  /** Where the student adds subjects. Omitted where that isn't theirs to
   * open (the abiturient profile), and the empty line shows no link. */
  addHref?: string;
}

export function SubjectProgress({ addHref }: SubjectProgressProps = {}) {
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

  const empty = hydrated && subjects.length === 0;

  return (
    <DashboardCard
      icon={BookMarked}
      tone="sky"
      title="საგნობრივი პროგრესი"
      meta={subjects.length > 0 ? `${subjects.length} საგანი` : undefined}
    >
      {empty ? (
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          ჯერ საგნები არ დაგიმატებია
          {addHref && (
            <>
              {" · "}
              <Link href={addHref} className="font-medium text-[var(--accent-primary)] hover:underline">
                დაამატე დეშბორდზე →
              </Link>
            </>
          )}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {subjects.map((subject) => (
            <li key={subject.name}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-[var(--text-primary)]">{subject.name}</span>
                <span className="shrink-0 tabular-nums text-[var(--text-secondary)]">
                  {subject.progress}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                <div
                  className="h-full rounded-full bg-[var(--accent-primary)] transition-[width] duration-500"
                  style={{ width: `${subject.progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {subject.quizzes > 0
                  ? `${subject.quizzes} ქვიზი${subject.accuracy !== null ? ` · ${subject.accuracy}% სიზუსტე` : ""}`
                  : `${subject.activityCount} აქტივობა`}
                {" · "}
                {lastActivityLabel(subject.lastActivityAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
