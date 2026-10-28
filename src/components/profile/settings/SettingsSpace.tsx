"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ActiveBadge, psButton, SettingsCard, SettingsPageTitle } from "@/components/profile/settings-ui";
import { readSemesterSubjects, SEMESTER_SUBJECTS_UPDATED_EVENT } from "@/lib/semester-subjects";
import { STUDY_PLAN_SUBJECTS } from "@/lib/study-plan-subjects";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

const SPACE_CARD = {
  student: {
    name: "სტუდენტი",
    line: "უნივერსიტეტის საგნები, სილაბუსი და სემესტრის გეგმა",
    stripe: "bg-[#ec4899]",
    manageHref: "/dashboard-student",
  },
  abiturient: {
    name: "აბიტურიენტი",
    line: "საგამოცდო საგნები, წინა წლების ტესტები და სიმულაციები",
    stripe: "bg-[#facc15]",
    manageHref: "/dashboard-abit",
  },
} as const;

const CHIP =
  "inline-flex h-8 items-center rounded-full border border-[var(--ps-border)] bg-[var(--ps-soft)] px-3 text-[13.5px] font-medium text-[var(--ps-title)]";

/** The student's own semester subjects, read on the client (they live on the account store). */
function useStudentSubjects(enabled: boolean): string[] | null {
  const [names, setNames] = useState<string[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const load = () => setNames(readSemesterSubjects().subjects.map((subject) => subject.name));
    load();
    window.addEventListener(SEMESTER_SUBJECTS_UPDATED_EVENT, load);
    return () => window.removeEventListener(SEMESTER_SUBJECTS_UPDATED_EVENT, load);
  }, [enabled]);
  return names;
}

/**
 * The working space and only its subjects: a student's own university
 * subjects, an abiturient's exam subjects. Switching goes through the same
 * chooser as everywhere else.
 */
export function SettingsSpace({ space }: { space: SpaceeduSpace | null }) {
  const kind = space === "student" ? "student" : space === "abiturient" || space === "school" ? "abiturient" : null;
  const studentSubjects = useStudentSubjects(kind === "student");
  const subjects =
    kind === "student" ? studentSubjects : kind === "abiturient" ? STUDY_PLAN_SUBJECTS.map((subject) => subject.title) : [];

  return (
    <>
      <SettingsPageTitle>სასწავლო სივრცე</SettingsPageTitle>

      <SettingsCard title="მიმდინარე სივრცე" subtitle="ხელსაწყოები და საგნები ამ სივრცეს მიჰყვება">
        {kind ? (
          <div className="flex items-stretch gap-4 rounded-[18px] border border-[var(--ps-border)] p-4">
            <span className={`w-1.5 shrink-0 rounded-full ${SPACE_CARD[kind].stripe}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[17px] font-bold text-[var(--ps-title)]">{SPACE_CARD[kind].name}</span>
                <ActiveBadge />
              </div>
              <p className="mt-1 text-[13.5px] text-[var(--ps-muted)]">{SPACE_CARD[kind].line}</p>
            </div>
          </div>
        ) : (
          <p className="text-[14.5px] text-[var(--ps-text)]">სივრცე ჯერ არ აგირჩევია.</p>
        )}
        <div className="ps-actions mt-5">
          <Link href="/select-space" className={psButton(kind ? "secondary" : "primary")}>
            {kind ? "სივრცის შეცვლა" : "სივრცის არჩევა"}
          </Link>
        </div>
      </SettingsCard>

      {kind ? (
        <SettingsCard
          title={kind === "student" ? "შენი საგნები" : "საგამოცდო საგნები"}
          subtitle={kind === "student" ? "ამ სემესტრის საგნები" : "საგნები, რომლებშიც ემზადები"}
          action={
            <Link
              href={SPACE_CARD[kind].manageHref}
              className="ps-focus inline-flex shrink-0 items-center gap-1 rounded-md text-[13.5px] font-semibold text-[#be185d] hover:underline dark:text-[#f9a8d4]"
            >
              საგნების მართვა
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        >
          {subjects === null ? (
            <div className="h-8" aria-hidden />
          ) : subjects.length === 0 ? (
            <p className="text-[14.5px] text-[var(--ps-muted)]">საგნები ჯერ არ დაგიმატებია.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {subjects.map((name) => (
                <li key={name} className={CHIP}>
                  {name}
                </li>
              ))}
            </ul>
          )}
        </SettingsCard>
      ) : null}
    </>
  );
}
