"use client";

import { logActivity } from "@/lib/activity-log";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { StudyPlanResponse } from "@/lib/ai/study-plan-schema";
import { recordDailyActivity } from "@/lib/daily-streak";
import { readSemesterSubjects } from "@/lib/semester-subjects";
import {
  localToday,
  newSavedPlan,
  readSavedPlan,
  toggleDone,
  writeSavedPlan,
  type SavedStudyPlan,
} from "@/lib/study-plan-board";
import { saveStudyPlanToDashboard } from "@/lib/study-plan-calendar";
import { bindSyllabusToSubject, getGeneratedMilestones, type SyllabusMilestone } from "@/lib/syllabus-calendar";
import {
  milestonesForSubject,
  normalizeSyllabusDate,
  sortSyllabusDates,
  syllabusTopics,
  unboundMilestones,
} from "@/lib/syllabus-dates";
import { PlanBoard } from "./PlanBoard";
import { PlannerForm, type PlannerValues } from "./PlannerForm";
import { SP_CARD, SP_FOCUS, SP_PRIMARY, SP_QUIET } from "./planner-styles";
import { SyllabusDatesCard } from "./SyllabusDatesCard";

const BUSY_ERROR = "AI ახლა გადატვირთულია, სცადე ცოტა ხანში.";

/**
 * The student's study plan, all on one screen: the form in one card at the
 * top, then the plan with the subject's syllabus dates beside it (under it
 * on phones). The plan and its done days stay on this device.
 */
export function StudyPlanPlanner() {
  // A notification's „გეგმის გახსნა“ opens its day; the syllabus analyzer
  // sends its subject (`?subject=`), with the syllabus topics.
  const searchParams = useSearchParams();
  const focusDay = searchParams.get("day");
  const subjectParam = searchParams.get("subject")?.trim() || null;
  const [today, setToday] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<SyllabusMilestone[]>([]);
  const [values, setValues] = useState<PlannerValues>({ subject: "", examDate: "", hoursPerDay: 2, topics: [] });
  const [topicsFromSyllabus, setTopicsFromSyllabus] = useState(false);
  const [saved, setSaved] = useState<SavedStudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // „განახლება“ over a plan with done days asks first.
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [onCalendar, setOnCalendar] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setToday(localToday());
      setSubjects(readSemesterSubjects().subjects.map((item) => item.name.trim()).filter(Boolean));
      const stored = getGeneratedMilestones();
      setMilestones(stored);
      const last = readSavedPlan();
      if (last) {
        setSaved(last);
        setValues({ subject: last.subject, examDate: last.examDate, hoursPerDay: last.hoursPerDay, topics: last.topics });
        const fromSyllabus = syllabusTopics(milestonesForSubject(stored, last.subject));
        setTopicsFromSyllabus(last.topics.length > 0 && last.topics.join("|") === fromSyllabus.join("|"));
      }
      if (subjectParam && subjectParam !== last?.subject) {
        const topics = syllabusTopics(milestonesForSubject(stored, subjectParam));
        setValues({ subject: subjectParam, examDate: "", hoursPerDay: last?.hoursPerDay ?? 2, topics });
        setTopicsFromSyllabus(topics.length > 0);
      }
    });
  }, [subjectParam]);

  const subjectMilestones = useMemo(() => milestonesForSubject(milestones, values.subject), [milestones, values.subject]);
  const dates = useMemo(
    () => (subjectMilestones.length > 0 && today ? sortSyllabusDates(subjectMilestones.map((item) => normalizeSyllabusDate(item)), today) : null),
    [subjectMilestones, today],
  );
  const unboundCount = unboundMilestones(milestones).length;

  /** A new subject brings its syllabus topics, unless the student typed their own. */
  const changeValues = (next: PlannerValues) => {
    if (next.subject !== values.subject && (values.topics.length === 0 || topicsFromSyllabus)) {
      const topics = syllabusTopics(milestonesForSubject(milestones, next.subject));
      setValues({ ...next, topics });
      setTopicsFromSyllabus(topics.length > 0);
      return;
    }
    setValues(next);
  };

  const bind = (subject: string) => {
    bindSyllabusToSubject(subject);
    const next = getGeneratedMilestones();
    setMilestones(next);
    if (subject === values.subject && (values.topics.length === 0 || topicsFromSyllabus)) {
      const topics = syllabusTopics(milestonesForSubject(next, subject));
      setValues((current) => ({ ...current, topics }));
      setTopicsFromSyllabus(topics.length > 0);
    }
  };

  const generate = async () => {
    setConfirmReplace(false);
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAiJson<StudyPlanResponse>({
        pageType: "study-plan",
        responseMode: "json",
        payload: {
          subject: values.subject.trim(),
          topics: values.topics.join(", "),
          examDate: values.examDate,
          hoursPerDay: values.hoursPerDay,
          preparationLevel: "intermediate",
        },
      });
      const plan = newSavedPlan({
        subject: values.subject.trim(),
        examDate: values.examDate,
        hoursPerDay: values.hoursPerDay,
        topics: values.topics,
        plan: data.plan,
        totalDays: data.total_days,
        advice: data.advice,
        general: values.topics.length === 0,
      });
      writeSavedPlan(plan);
      setSaved(plan);
      setOnCalendar(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(/[ა-ჿ]/.test(message) ? message : BUSY_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    if (saved && saved.done.length > 0) {
      setConfirmReplace(true);
      return;
    }
    void generate();
  };

  const markDone = (date: string) => {
    if (!saved) return;
    const wasDone = saved.done.includes(date);
    const next = { ...saved, done: toggleDone(saved.done, date) };
    writeSavedPlan(next);
    setSaved(next);
    if (!wasDone) {
      recordDailyActivity();
      logActivity({
        type: "plan_day_done",
        tool: "study_plan",
        space: "student",
        subject: saved.subject || null,
        meta: { hours: saved.plan.find((day) => day.date === date)?.hours ?? saved.hoursPerDay },
      });
    }
  };

  const toCalendar = () => {
    if (!saved) return;
    saveStudyPlanToDashboard("student", saved.subject || "სასწავლო გეგმა", saved.plan, saved.totalDays);
    setOnCalendar(true);
  };

  return (
    // Phones: the page colour also runs under the shell's dock padding.
    <div className="sp under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1080px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-center gap-3">
          <Link
            href="/dashboard-student"
            aria-label="დეშბორდზე დაბრუნება"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--sp-line)] bg-[var(--sp-card)] text-[var(--sp-strong)] transition-colors hover:border-[var(--sp-muted)] ${SP_FOCUS}`}
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold leading-tight text-[var(--sp-strong)] sm:text-[26px]">სასწავლო გეგმა</h1>
            <p className="text-[14px] text-[var(--sp-muted)]">მითხარი, რას აბარებ და როდის — დღეებად დაგიყოფ</p>
          </div>
        </header>

        <section aria-label="გეგმის პარამეტრები" className={`${SP_CARD} mt-6 p-4 sm:mt-8 sm:p-5`}>
          <PlannerForm
            values={values}
            onChange={changeValues}
            subjects={subjects}
            today={today}
            loading={loading}
            hasPlan={Boolean(saved)}
            topicsFromSyllabus={topicsFromSyllabus}
            onSubmit={submit}
          />
        </section>

        {confirmReplace ? (
          <Alert
            tone="warning"
            className="mt-4"
            title="ახალი გეგმა ძველს ჩაანაცვლებს. გავაგრძელო?"
            action={
              <>
                <button type="button" onClick={() => void generate()} className={`${SP_PRIMARY} h-9 px-4 text-[13.5px]`}>
                  გაგრძელება
                </button>
                <button type="button" onClick={() => setConfirmReplace(false)} className={SP_QUIET}>
                  გაუქმება
                </button>
              </>
            }
          >
            შესრულებულად მონიშნული დღეები ძველ გეგმასთან ერთად წაიშლება.
          </Alert>
        ) : null}
        {error ? (
          <Alert tone="error" className="mt-4" title="გეგმა ვერ შევადგინე">
            {error}
          </Alert>
        ) : null}

        <div className="mt-5 flex flex-wrap items-start gap-5">
          <div className="min-w-0 flex-[999_1_560px] max-[901px]:basis-full">
            <PlanBoard
              saved={saved}
              loading={loading}
              today={today}
              onToggleDone={markDone}
              onToCalendar={toCalendar}
              onCalendar={onCalendar}
              focusDay={focusDay}
            />
          </div>
          <div className="min-w-0 flex-[1_1_260px] max-[901px]:basis-full min-[901px]:max-w-[300px]">
            <SyllabusDatesCard
              subject={values.subject}
              list={dates}
              today={today}
              unboundCount={unboundCount}
              subjects={subjects}
              onBind={bind}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
