"use client";

import { useEffect, useMemo, useState } from "react";
import { getSavedStudyPlan, STUDY_PLAN_CALENDAR_UPDATED_EVENT } from "@/lib/study-plan-calendar";
import { STUDY_PLAN_SUBJECTS } from "@/lib/study-plan-subjects";
import { MONTH_LONG } from "@/lib/study-day";
import type { StatsRange } from "@/lib/stats/common";
import { ESSAY_CRITERIA, getAbiturientStats, type MockResult } from "@/lib/stats/abiturient";
import { ActivityMap, BarRow, Block, EmptyNote, Metric, StatsHeader, useActivityLog } from "./stats-ui";

const RANGES: StatsRange[] = ["7d", "30d", "until_exam"];
const EXAM_SUBJECTS = STUDY_PLAN_SUBJECTS.map((subject) => subject.title);
const PAST_EXAMS_HREF = "/subject/history/past-exams";

/** The exam date the abiturient planned towards: the last day of their saved plan. */
function usePlannedExamDate(): string | null {
  const [date, setDate] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      const days = getSavedStudyPlan("abiturient")?.days ?? [];
      setDate(days.length ? days[days.length - 1].date : null);
    };
    read();
    window.addEventListener(STUDY_PLAN_CALENDAR_UPDATED_EVENT, read);
    return () => window.removeEventListener(STUDY_PLAN_CALENDAR_UPDATED_EVENT, read);
  }, []);
  return date;
}

function shortDate(at: number): string {
  const date = new Date(at);
  return `${date.getDate()} ${MONTH_LONG[date.getMonth()].slice(0, 3)}.`;
}

function MockChart({ mocks }: { mocks: MockResult[] }) {
  return (
    <ol className="flex h-[200px] items-end gap-3" aria-label="ბოლო სიმულაციების შედეგები">
      {mocks.map((mock, index) => {
        const last = index === mocks.length - 1;
        return (
          <li key={mock.id} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className={`text-[13px] font-semibold ${last ? "text-[var(--ps-title)]" : "text-[var(--ps-muted)]"}`}>{mock.score}%</span>
            <span
              className="w-full max-w-[56px] rounded-t-[10px]"
              style={{ height: `${Math.max(4, mock.score) * 1.3}px`, background: last ? "#ca8a04" : "#fde68a" }}
              title={`${mock.subject} · ${mock.score}%`}
            />
            <span className="w-full truncate text-center text-[12px] text-[var(--ps-muted)]">{shortDate(mock.at)}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** The abiturient's stats: only the abiturient space's activity, readiness per exam subject. */
export function AbiturientStatsPage() {
  const [range, setRange] = useState<StatsRange>("30d");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const log = useActivityLog();
  const examDate = usePlannedExamDate();
  const stats = useMemo(
    () => (log ? getAbiturientStats(log, EXAM_SUBJECTS, range, examDate) : null),
    [log, range, examDate],
  );
  const mockSubjects = useMemo(() => [...new Set(stats?.allMocks.map((mock) => mock.subject).filter(Boolean) ?? [])], [stats]);
  const chartMocks = (stats?.allMocks ?? []).filter((mock) => !subjectFilter || mock.subject === subjectFilter).slice(-6);

  return (
    <>
      <StatsHeader space="abiturient" ranges={RANGES} range={range} onRange={setRange} />

      {!stats ? (
        <div className="h-[124px]" aria-hidden />
      ) : (
        <>
          <section aria-label="მთავარი მაჩვენებლები" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {stats.lastMock ? (
              <Metric
                label="საცდელი გამოცდები"
                value={String(stats.mockCount)}
                sub={`ბოლო: ${stats.lastMock.subject || "გამოცდა"}, ${stats.lastMock.score}%`}
              />
            ) : (
              <Metric label="საცდელი გამოცდები" empty={{ text: "სიმულაცია ჯერ არ გაგივლია", href: PAST_EXAMS_HREF, cta: "დაიწყე სიმულაცია" }} />
            )}
            {stats.averageScore !== null ? (
              <Metric
                label="საშუალო ქულა"
                value={`${stats.averageScore}%`}
                sub={
                  stats.averageDelta === null || stats.averageDelta === 0
                    ? "პირველ სიმულაციასთან იგივე"
                    : `${stats.averageDelta > 0 ? "+" : ""}${stats.averageDelta} პირველთან`
                }
                good={(stats.averageDelta ?? 0) > 0}
              />
            ) : (
              <Metric label="საშუალო ქულა" empty={{ text: "ქულა სიმულაციის შემდეგ გამოჩნდება", href: PAST_EXAMS_HREF, cta: "სიმულაცია" }} />
            )}
            {stats.solvedTasks > 0 ? (
              <Metric label="ამოხსნილი დავალებები" value={String(stats.solvedTasks)} sub="წინა წლების ტესტებიდან" />
            ) : (
              <Metric label="ამოხსნილი დავალებები" empty={{ text: "წინა წლების ტესტი ჯერ არ ამოგიხსნია", href: PAST_EXAMS_HREF, cta: "ტესტები" }} />
            )}
            {stats.examDaysLeft !== null ? (
              <Metric label="გამოცდამდე" value={`${stats.examDaysLeft} დღე`} sub="შენი სასწავლო გეგმით" />
            ) : (
              <Metric label="გამოცდამდე" empty={{ text: "გამოცდის თარიღი გეგმაში დააყენე", href: "/study-plan/abit", cta: "შექმენი გეგმა" }} />
            )}
          </section>

          <Block title="საგნების მზადყოფნა" action={<span className="text-[13px] text-[var(--ps-muted)]">სიმულაციები და ტესტები</span>}>
            {stats.readiness.every((subject) => subject.readiness === 0) ? (
              <div className="mb-4">
                <EmptyNote text="მზადყოფნა პირველი სიმულაციის შემდეგ გამოჩნდება." href={PAST_EXAMS_HREF} cta="დაიწყე სიმულაცია" />
              </div>
            ) : null}
            <ul className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              {stats.readiness.map((subject) => (
                <BarRow key={subject.name} label={subject.name} value={subject.readiness} max={100} display={`${subject.readiness}%`} fill="#ca8a04" />
              ))}
            </ul>
          </Block>

          <Block
            title="საცდელი გამოცდების შედეგი"
            action={
              mockSubjects.length > 1 ? (
                <select
                  aria-label="საგანი"
                  value={subjectFilter}
                  onChange={(event) => setSubjectFilter(event.target.value)}
                  className="ps-field !h-9 !w-auto !rounded-full !px-3 !text-[13.5px]"
                >
                  <option value="">ყველა საგანი</option>
                  {mockSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              ) : null
            }
          >
            {chartMocks.length === 0 ? (
              <EmptyNote text="სიმულაცია ჯერ არ გაგივლია." href={PAST_EXAMS_HREF} cta="დაიწყე სიმულაცია" />
            ) : (
              <MockChart mocks={chartMocks} />
            )}
          </Block>

          <Block title="თემის წერა">
            {stats.essay.count === 0 || stats.essay.average === null ? (
              <EmptyNote text="თემა ამ პერიოდში არ შეგიფასებია." href="/subject/georgian/essay-grader" cta="დაწერე თემა" />
            ) : (
              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="shrink-0 rounded-[18px] bg-[var(--ps-yellow-bg)] px-5 py-4 text-[var(--ps-yellow)]">
                  <p className="text-[13px] font-medium">საშუალო AI შეფასება</p>
                  <p className="mt-1 text-[28px] font-bold leading-none">{stats.essay.average} / 10</p>
                  <p className="mt-1 text-[12.5px]">{stats.essay.count} თემა</p>
                </div>
                <ul className="flex flex-1 flex-col gap-4">
                  {ESSAY_CRITERIA.map(({ key, label }) => {
                    const score = stats.essay.criteria[key];
                    return (
                      <BarRow
                        key={key}
                        label={label}
                        value={score ?? 0}
                        max={10}
                        display={score === null ? "—" : `${score} / 10`}
                        fill="#ca8a04"
                      />
                    );
                  })}
                </ul>
              </div>
            )}
          </Block>

          <ActivityMap heatmap={stats.heatmap} best={stats.bestStreak} busiest={stats.busiestWeekday} />
        </>
      )}
    </>
  );
}
