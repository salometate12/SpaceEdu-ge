"use client";

import { useEffect, useMemo, useState } from "react";
import { readSemesterSubjects, SEMESTER_SUBJECTS_UPDATED_EVENT } from "@/lib/semester-subjects";
import { RANGE_LABEL, type StatsRange } from "@/lib/stats/common";
import { getStudentStats } from "@/lib/stats/student";
import { ActivityMap, BarRow, Block, EmptyNote, Metric, StatsHeader, TOOL_LABEL, toolFill, useActivityLog } from "./stats-ui";

const RANGES: StatsRange[] = ["7d", "30d", "semester"];

function useSubjectNames(): string[] {
  const [names, setNames] = useState<string[]>([]);
  useEffect(() => {
    const read = () => setNames(readSemesterSubjects().subjects.map((subject) => subject.name));
    read();
    window.addEventListener(SEMESTER_SUBJECTS_UPDATED_EVENT, read);
    return () => window.removeEventListener(SEMESTER_SUBJECTS_UPDATED_EVENT, read);
  }, []);
  return names;
}

function periodWord(range: StatsRange, days: number): string {
  return range === "semester" ? `სემესტრის ${days} დღიდან` : `${days} დღიდან`;
}

/** The student's stats: only the student space's activity, only their own subjects. */
export function StudentStatsPage() {
  const [range, setRange] = useState<StatsRange>("30d");
  const log = useActivityLog();
  const subjects = useSubjectNames();
  const stats = useMemo(() => (log ? getStudentStats(log, subjects, range) : null), [log, subjects, range]);

  const aiDelta = stats ? stats.aiSessions - stats.aiSessionsPrevious : 0;
  const maxTool = stats?.tools[0]?.count ?? 0;

  return (
    <>
      <StatsHeader space="student" ranges={RANGES} range={range} onRange={setRange} />

      {!stats ? (
        <div className="h-[124px]" aria-hidden />
      ) : (
        <>
          <section aria-label="მთავარი მაჩვენებლები" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {stats.activeDays > 0 ? (
              <Metric label="აქტიური დღეები" value={String(stats.activeDays)} sub={periodWord(range, stats.periodDays)} />
            ) : (
              <Metric label="აქტიური დღეები" empty={{ text: `${RANGE_LABEL[range]}: აქტივობა არ არის`, href: "/dashboard-student", cta: "დაიწყე" }} />
            )}
            {stats.quizzes > 0 ? (
              <Metric label="ქვიზები" value={String(stats.quizzes)} sub={stats.quizAverage !== null ? `საშუალოდ ${stats.quizAverage}%` : undefined} />
            ) : (
              <Metric label="ქვიზები" empty={{ text: "ქვიზი ჯერ არ გაგივლია", href: "/quiz", cta: "დაიწყე ქვიზი" }} />
            )}
            {stats.aiSessions > 0 ? (
              <Metric
                label="AI საუბრები"
                value={String(stats.aiSessions)}
                sub={aiDelta === 0 ? "იგივე, რაც წინა პერიოდში" : `${aiDelta > 0 ? "+" : ""}${aiDelta} წინა პერიოდთან`}
                good={aiDelta > 0}
              />
            ) : (
              <Metric label="AI საუბრები" empty={{ text: "AI მასწავლებელს ჯერ არ ესაუბრე", href: "/ai-teacher", cta: "ჰკითხე" }} />
            )}
            {stats.studyHours > 0 ? (
              <Metric label="სწავლის დრო" value={`${stats.studyHours} სთ`} sub="გეგმის შესრულებული დღეებით" />
            ) : (
              <Metric label="სწავლის დრო" empty={{ text: "გეგმის დღე ჯერ არ მოგინიშნავს", href: "/study-plan", cta: "გეგმა" }} />
            )}
          </section>

          <ActivityMap heatmap={stats.heatmap} best={stats.bestStreak} busiest={stats.busiestWeekday} />

          <Block title="საგნების პროგრესი" action={<span className="text-[13px] text-[var(--ps-muted)]">გეგმის დღეები და ქვიზები</span>}>
            {stats.subjects.length === 0 ? (
              <EmptyNote text="საგნები ჯერ არ დაგიმატებია." href="/dashboard-student" cta="დაამატე საგნები" />
            ) : (
              <>
                {stats.subjects.every((subject) => subject.progress === 0) ? (
                  <div className="mb-4">
                    <EmptyNote text="ჯერ არცერთ საგანში პროგრესი არ გაქვს." href="/study-plan" cta="დაიწყე გეგმით" />
                  </div>
                ) : null}
                <ul className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                  {stats.subjects.map((subject) => (
                    <BarRow key={subject.name} label={subject.name} value={subject.progress} max={100} display={`${subject.progress}%`} fill="#ec4899" />
                  ))}
                </ul>
              </>
            )}
          </Block>

          <Block title="ხელსაწყოები" action={<span className="text-[13px] text-[var(--ps-muted)]">გახსნები, {RANGE_LABEL[range]}</span>}>
            {stats.tools.length === 0 ? (
              <EmptyNote text="ამ პერიოდში ხელსაწყო არ გაგიხსნია." href="/dashboard-student" cta="ხელსაწყოები" />
            ) : (
              <ul className="flex flex-col gap-4">
                {stats.tools.map((tool) => (
                  <BarRow key={tool.tool} label={TOOL_LABEL[tool.tool]} value={tool.count} max={maxTool} display={String(tool.count)} fill={toolFill(tool.tool)} />
                ))}
              </ul>
            )}
          </Block>
        </>
      )}
    </>
  );
}
