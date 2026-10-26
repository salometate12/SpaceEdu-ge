"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  Download,
  FileText,
  Info,
  ListChecks,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { FetchAiError, fetchAiMultipartJson } from "@/lib/ai/fetch-ai";
import type { SyllabusResponse } from "@/lib/ai/syllabus-schema";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { formatBytes } from "@/lib/research-files";
import { readSemesterSubjects } from "@/lib/semester-subjects";
import {
  addMilestonesToDashboardCalendar,
  addMilestoneToDashboardCalendar,
  bindSyllabusToSubject,
  clearLegacySyllabusMockData,
  getDashboardCalendarEvents,
  getGeneratedMilestones,
  isMilestoneOnDashboard,
  moveSyllabusToSubject,
  removeDashboardCalendarEvent,
  saveSubjectSyllabus,
  setGeneratedMilestones,
  type SyllabusMilestone,
} from "@/lib/syllabus-calendar";
import {
  matchSemesterSubject,
  milestonesForSubject,
  normalizeSyllabusDate,
  savedSyllabi,
  semesterRangeLabel,
  unboundMilestones,
  type SavedSyllabus,
} from "@/lib/syllabus-dates";
import { PICKS, SY_FOCUS, SyllabusResult, type SyllabusPick } from "./SyllabusResult";

const MAX_BYTES = 15 * 1024 * 1024;
const CARD = "rounded-[22px] border border-[var(--sy-card-border)] bg-[var(--sy-card)]";
const FIELD =
  "h-[46px] w-full rounded-[14px] border border-[var(--sy-field-border)] bg-[var(--sy-field)] px-3.5 text-[16px] text-[var(--sy-strong)] outline-none transition-colors focus:border-[var(--sy-strong)] sm:text-[14.5px]";
const SECONDARY = `inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--sy-field-border)] bg-[var(--sy-field)] text-[14px] font-semibold text-[var(--sy-strong)] transition-colors hover:border-[var(--sy-muted)] disabled:opacity-50 ${SY_FOCUS}`;
const PRIMARY = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--sy-accent)] text-[15px] font-bold text-white transition-[filter,opacity] hover:brightness-110 disabled:pointer-events-none disabled:opacity-45 ${SY_FOCUS}`;
const BUSY_ERROR = "AI ახლა გადატვირთულია, სცადე ცოტა ხანში.";

const STEPS = ["ვკითხულობ სილაბუსს", "ვპოულობ თარიღებს", "ვაწყობ კალენდარს"];
const STEP_AT_MS = [3000, 9000];

function localToday(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function Analyzing() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = STEP_AT_MS.map((ms, index) => window.setTimeout(() => setStep(index + 1), ms));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);
  return (
    <div aria-busy>
      <p className="text-[18px] font-bold text-[var(--sy-strong)]">ვაანალიზებ სილაბუსს</p>
      <ol className="mt-4 space-y-3" aria-live="polite">
        {STEPS.map((label, index) => {
          const state = index < step ? "done" : index === step ? "current" : "next";
          return (
            <li key={label} aria-current={state === "current" ? "step" : undefined} className={`flex items-center gap-3 ${state === "next" ? "opacity-50" : ""}`}>
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  state === "done" ? "bg-[var(--sy-ok)] text-white" : state === "current" ? "border-2 border-[var(--sy-strong)]" : "border-2 border-[var(--sy-field-border)]"
                }`}
              >
                {state === "done" ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : state === "current" ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--sy-accent)] motion-reduce:animate-none" />
                ) : null}
              </span>
              <span className={`text-[15px] ${state === "current" ? "font-semibold text-[var(--sy-strong)]" : "text-[var(--sy-text)]"}`}>
                {label}
                {state === "done" ? <span className="sr-only"> — მზადაა</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4" aria-hidden>
        {[0, 1, 2, 3].map((tile) => (
          <div key={tile} className="h-[68px] animate-pulse rounded-[14px] bg-[var(--sy-soft)] motion-reduce:animate-none" />
        ))}
      </div>
      <div className="mt-4 space-y-2" aria-hidden>
        {[0, 1, 2].map((rowIndex) => (
          <div key={rowIndex} className="h-[68px] animate-pulse rounded-[14px] bg-[var(--sy-list)] motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}

const GAINS = [
  { icon: CalendarDays, title: "სემესტრის კალენდარი", text: "ყველა კვირა თემებით", tone: "bg-[var(--sy-due-bg)] text-[var(--sy-due)]" },
  { icon: Clock, title: "გამოცდები და ვადები", text: "შეხსენებები 3 და 1 დღით ადრე", tone: "bg-[var(--sy-exam-bg)] text-[var(--sy-exam)]" },
  { icon: ListChecks, title: "სასწავლო გეგმა", text: "თემები ავტომატურად გეგმაში", tone: "bg-[var(--sy-quiz-bg)] text-[var(--sy-quiz)]" },
];

const SUBJECT_DOTS = ["#8b5cf6", "#3b82f6", "#f59e0b", "#10b981", "#ec4899", "#06b6d4"];

/** What's on screen: an analysis just made, or one reopened from the saved ones. */
interface Shown {
  subject: string | null;
  ids: Set<string>;
  fileName: string | null;
  insight: string;
  warnings: string[];
}

/**
 * The syllabus analyzer: the PDF, its subject, the semester start and what
 * to pull out on the left; on the right what you get and your saved
 * syllabi, then the analysis — count tiles, dates by month, the week plan.
 * Dates can be fixed or removed; everything stays bound to the subject.
 */
export function SyllabusAnalyzer() {
  const [today, setToday] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [semesterStart, setSemesterStart] = useState("");
  const [startFromSyllabus, setStartFromSyllabus] = useState(false);
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [picks, setPicks] = useState<Set<SyllabusPick>>(new Set(["plan", "exams", "quizzes"]));
  const [stored, setStored] = useState<SyllabusMilestone[]>([]);
  const [shown, setShown] = useState<Shown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [boundTo, setBoundTo] = useState<string | null>(null);
  const [onDashboard, setOnDashboard] = useState(false);
  const rightRef = useRef<HTMLElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => {
      clearLegacySyllabusMockData();
      setToday(localToday());
      setSubjects(readSemesterSubjects().subjects.map((item) => item.name.trim()).filter(Boolean));
      setStored(getGeneratedMilestones());
    });
  }, []);

  const shownMilestones = shown ? stored.filter((item) => shown.ids.has(item.id)) : [];
  const unbound = unboundMilestones(stored);
  const saved = today ? savedSyllabi(stored, today) : [];

  const pickFile = (next: File) => {
    const isPdf = next.type === "application/pdf" || next.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFileError("მხოლოდ PDF ფაილი მიიღება.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setFileError(`ფაილი ძალიან დიდია: ${formatBytes(next.size)} · მაქს. ${formatBytes(MAX_BYTES)}. შეკუმშე PDF ან ატვირთე მხოლოდ საჭირო გვერდები.`);
      return;
    }
    setFileError(null);
    setError(null);
    setFile(next);
  };

  /** One column: the analysis is below, so bring it into view. */
  const revealRight = () => {
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => rightRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }));
  };

  const analyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setCanRetry(false);
    setOnDashboard(false);
    revealRight();
    try {
      const data = await fetchAiMultipartJson<SyllabusResponse>({
        pageType: "syllabus",
        file,
        // Optional: without it the syllabus's own start date (if stated) is used.
        fields: semesterStart ? { semesterStartDate: semesterStart } : {},
      });
      const onCalendar = new Map(getDashboardCalendarEvents().map((event) => [event.id, event.date]));
      const next: SyllabusMilestone[] = data.milestones.map((item) => {
        // A date the student already set for this same event survives a re-analysis.
        const manualDate = item.date === null ? onCalendar.get(item.id) : undefined;
        return {
          id: item.id,
          title: item.title,
          date: manualDate ?? item.date,
          dateStatus: manualDate ? "manual" : item.dateStatus,
          week: item.week ?? undefined,
          topic: item.topic ?? undefined,
          type: item.type,
          semesterStart: data.semesterStartDate ?? undefined,
          weight: item.weight ?? undefined,
        };
      });
      if (next.length === 0) throw new Error("სილაბუსიდან თარიღები ვერ მოიძებნა. სცადე სხვა PDF ან უფრო ტექსტური ფაილი.");
      // The course named in the syllabus picks the semester subject, unless one is chosen.
      const owner = subject || matchSemesterSubject(data.courseName, subjects) || "";
      saveSubjectSyllabus(owner || null, next);
      setStored(getGeneratedMilestones());
      setSubject(owner);
      if (!semesterStart && data.semesterStartDate) {
        setSemesterStart(data.semesterStartDate);
        setStartFromSyllabus(true);
      }
      setShown({ subject: owner || null, ids: new Set(next.map((item) => item.id)), fileName: file.name, insight: data.insight, warnings: data.warnings ?? [] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(/[ა-ჿ]/.test(message) ? message : BUSY_ERROR);
      setCanRetry(err instanceof FetchAiError && err.retryable);
    } finally {
      setLoading(false);
    }
  };

  /** From „შენი სილაბუსები“: the saved analysis, no AI call. */
  const reopen = (row: SavedSyllabus) => {
    const items = row.subject ? milestonesForSubject(stored, row.subject) : unboundMilestones(stored);
    setShown({ subject: row.subject, ids: new Set(items.map((item) => item.id)), fileName: null, insight: "", warnings: [] });
    setSubject(row.subject ?? "");
    const start = items.map((item) => item.semesterStart).find(Boolean);
    setSemesterStart(start ?? "");
    setStartFromSyllabus(Boolean(start));
    setFile(null);
    setOnDashboard(items.filter((item) => item.date).every((item) => isMilestoneOnDashboard(item.id)));
    revealRight();
  };

  const reset = () => {
    setShown(null);
    setFile(null);
    setSubject("");
    setSemesterStart("");
    setStartFromSyllabus(false);
    setError(null);
    setOnDashboard(false);
  };

  /** Choosing the subject after the analysis moves its dates there. */
  const chooseSubject = (next: string) => {
    setSubject(next);
    if (shown) {
      moveSyllabusToSubject(shown.ids, next || null);
      setStored(getGeneratedMilestones());
      setShown({ ...shown, subject: next || null });
    }
  };

  const changeDate = (id: string, date: string) => {
    const next = stored.map((item) => (item.id === id ? { ...item, date, dateStatus: "manual" as const } : item));
    setGeneratedMilestones(next);
    setStored(next);
    const updated = next.find((item) => item.id === id);
    if (updated && isMilestoneOnDashboard(id)) addMilestoneToDashboardCalendar(updated);
  };

  const removeDate = (id: string) => {
    const next = stored.filter((item) => item.id !== id);
    setGeneratedMilestones(next);
    setStored(next);
    if (isMilestoneOnDashboard(id)) removeDashboardCalendarEvent(id);
  };

  const exportIcs = () => {
    const events = shownMilestones.flatMap((item) => {
      const date = normalizeSyllabusDate(item).date;
      return date ? [{ id: item.id, title: item.title, date, description: [shown?.subject, item.topic].filter(Boolean).join(" · ") || undefined }] : [];
    });
    // DTSTAMP: when the file was made, as 20261026T150000Z.
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    downloadIcs(buildIcs(events, { name: shown?.subject ?? "სილაბუსი", stamp }), `${shown?.subject ?? "syllabus"}-spaceedu`);
  };

  const addToDashboard = () => {
    addMilestonesToDashboardCalendar(shownMilestones.map((item) => ({ ...item, date: normalizeSyllabusDate(item).date })));
    setOnDashboard(true);
  };

  const togglePick = (pick: SyllabusPick) =>
    setPicks((current) => {
      const next = new Set(current);
      if (next.has(pick)) {
        if (next.size > 1) next.delete(pick);
      } else next.add(pick);
      return next;
    });

  const range = shown ? semesterRangeLabel(shownMilestones) : null;

  return (
    // Phones: the page colour also runs under the shell's dock padding.
    <div className="syllabus-page under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-center gap-3">
          <Link
            href="/dashboard-student"
            aria-label="დეშბორდზე დაბრუნება"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--sy-field-border)] bg-[var(--sy-card)] text-[var(--sy-strong)] transition-colors hover:border-[var(--sy-muted)] ${SY_FOCUS}`}
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold leading-tight text-[var(--sy-strong)] sm:text-[26px]">სილაბუსის ანალიზატორი</h1>
            <p className="text-[14px] text-[var(--sy-muted)]">ატვირთე სილაბუსი — თარიღები, გამოცდები და თემები სემესტრის კალენდარში</p>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-start gap-5 sm:mt-8">
          {/* Left: the syllabus. */}
          <section
            aria-label="სილაბუსი"
            className={`${CARD} min-w-0 flex-[1_1_340px] p-5 max-[901px]:basis-full min-[901px]:sticky min-[901px]:top-[calc(var(--site-header-h)+16px)] min-[901px]:max-w-[400px]`}
          >
            {unbound.length > 0 && !boundTo && !shown ? (
              <Alert
                tone="info"
                className="mb-4"
                title="ეს სილაბუსი საგანს არ აქვს მიბმული"
                action={
                  <select
                    aria-label="მიაბი საგანს"
                    defaultValue=""
                    onChange={(event) => {
                      if (!event.target.value) return;
                      bindSyllabusToSubject(event.target.value);
                      setStored(getGeneratedMilestones());
                      setBoundTo(event.target.value);
                    }}
                    className="h-9 max-w-full rounded-full border border-current/20 bg-white px-3 text-[13px] font-semibold text-slate-900 dark:bg-white/10 dark:text-slate-100"
                  >
                    <option value="">მიაბი საგანს…</option>
                    {subjects.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                }
              >
                {unbound.length} თარიღი სასწავლო გეგმაში არ ჩანს, სანამ საგანს არ მიაბამ. ხელახლა ატვირთვა არ სჭირდება.
              </Alert>
            ) : null}
            {boundTo && !shown ? (
              <Alert tone="success" className="mb-4">
                სილაბუსი მიება საგანს „{boundTo}“.
              </Alert>
            ) : null}

            {shown ? (
              <div className="space-y-4">
                {shown.fileName ? (
                  <div className="flex items-center gap-3 rounded-[14px] border border-[var(--sy-field-border)] bg-[var(--sy-field)] px-3.5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" aria-hidden>
                      <FileText className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-semibold text-[var(--sy-strong)]">{shown.fileName}</span>
                      <span className="flex items-center gap-1 text-[12.5px] font-medium text-[var(--sy-ok)]">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                        დამუშავდა
                      </span>
                    </span>
                  </div>
                ) : null}
                <div>
                  <label htmlFor="sy-subject" className="flex items-center gap-2 text-[13px] font-semibold text-[var(--sy-muted)]">
                    საგანი
                    {shown.subject ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--sy-plan-bg)] px-2 py-0.5 text-[11.5px] font-bold text-[var(--sy-plan)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--sy-dot-plan)]" aria-hidden />
                        ნაპოვნია
                      </span>
                    ) : null}
                  </label>
                  <select id="sy-subject" value={subject} onChange={(event) => chooseSubject(event.target.value)} className={`${FIELD} mt-1.5`}>
                    <option value="">აირჩიე საგანი</option>
                    {subjects.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {range ? <p className="mt-1.5 text-[12.5px] text-[var(--sy-muted)]">სემესტრი: {range}</p> : null}
                  {!shown.subject ? (
                    <p className="mt-1.5 text-[12.5px] text-[var(--sy-muted)]">აირჩიე საგანი, რომ თარიღები სასწავლო გეგმაში გამოჩნდეს.</p>
                  ) : null}
                </div>
                <div className="space-y-2.5 pt-1">
                  <Link
                    href={shown.subject ? `/study-plan?subject=${encodeURIComponent(shown.subject)}` : "/study-plan"}
                    className={PRIMARY}
                  >
                    სასწავლო გეგმის შექმნა
                  </Link>
                  <button type="button" onClick={exportIcs} className={SECONDARY}>
                    <Download className="h-4 w-4" aria-hidden />
                    კალენდარში გადატანა (.ics)
                  </button>
                  <button type="button" onClick={addToDashboard} disabled={onDashboard} className={SECONDARY}>
                    {onDashboard ? <Check className="h-4 w-4" aria-hidden /> : <CalendarPlus className="h-4 w-4" aria-hidden />}
                    {onDashboard ? "დეშბორდის კალენდარშია" : "დეშბორდის კალენდარში"}
                  </button>
                  <button type="button" onClick={reset} className={`inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[13.5px] font-semibold text-[var(--sy-muted)] hover:text-[var(--sy-strong)] ${SY_FOCUS}`}>
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    სხვა სილაბუსი
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {file ? (
                  <div className="flex items-center gap-3 rounded-[14px] border border-[var(--sy-field-border)] bg-[var(--sy-field)] px-3.5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300" aria-hidden>
                      <FileText className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-semibold text-[var(--sy-strong)]">{file.name}</span>
                      <span className="block text-[12.5px] text-[var(--sy-muted)]">{formatBytes(file.size)}</span>
                    </span>
                    <button type="button" onClick={() => setFile(null)} aria-label="ფაილის მოშორება" className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--sy-muted)] hover:bg-[var(--sy-soft)] ${SY_FOCUS}`}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <UploadDropzone
                    accept=".pdf,application/pdf"
                    onFiles={(files) => pickFile(files[0])}
                    label="ჩააგდე სილაბუსის PDF"
                    hint={`ან დააწკაპუნე · მხოლოდ PDF · მაქს. ${formatBytes(MAX_BYTES)}`}
                    className="min-h-[150px]"
                  />
                )}
                {fileError ? <Alert tone="error">{fileError}</Alert> : null}

                <div>
                  <label htmlFor="sy-subject" className="text-[13px] font-semibold text-[var(--sy-muted)]">
                    საგანი
                  </label>
                  <select id="sy-subject" value={subject} onChange={(event) => setSubject(event.target.value)} className={`${FIELD} mt-1.5`}>
                    <option value="">ავტომატურად სილაბუსიდან</option>
                    {subjects.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="sy-start" className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--sy-muted)]">
                    სემესტრის დაწყება · <span className="font-normal">არასავალდებულო</span>
                    <span className="group relative inline-flex" tabIndex={0} aria-label="რისთვის სჭირდება?">
                      <Info className="h-3.5 w-3.5" aria-hidden />
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-[10px] bg-[var(--sy-chip-on)] px-3 py-2 text-[12px] font-medium leading-snug text-[var(--sy-chip-on-text)] opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                      >
                        კვირის ნომრები („მე-8 კვირა“) ამით რეალურ თარიღებად გადაიყვანება.
                      </span>
                    </span>
                  </label>
                  <input
                    id="sy-start"
                    type="date"
                    value={semesterStart}
                    onChange={(event) => {
                      setSemesterStart(event.target.value);
                      setStartFromSyllabus(false);
                    }}
                    placeholder="სილაბუსიდან ავიღებ"
                    className={`${FIELD} mt-1.5`}
                  />
                  {startFromSyllabus ? <p className="mt-1.5 text-[12.5px] text-[var(--sy-muted)]">სილაბუსიდან ავიღე — შეგიძლია შეცვალო.</p> : null}
                </div>

                <div>
                  <p id="sy-picks" className="text-[13px] font-semibold text-[var(--sy-muted)]">
                    რა ამოვიღოთ?
                  </p>
                  <div role="group" aria-labelledby="sy-picks" className="mt-2 flex flex-wrap gap-2">
                    {PICKS.map((pick) => {
                      const active = picks.has(pick.id);
                      return (
                        <button
                          key={pick.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => togglePick(pick.id)}
                          className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-semibold transition-colors ${SY_FOCUS} ${
                            active
                              ? "bg-[var(--sy-chip-on)] text-[var(--sy-chip-on-text)]"
                              : "border border-[var(--sy-field-border)] bg-[var(--sy-field)] text-[var(--sy-strong)] hover:border-[var(--sy-muted)]"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ background: pick.dot }} aria-hidden />
                          {pick.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button type="button" onClick={() => void analyze()} disabled={!file || loading} className={PRIMARY}>
                  {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin motion-reduce:animate-none" aria-hidden /> : null}
                  {loading ? "ვაანალიზებ…" : "კალენდრის შექმნა"}
                </button>
              </div>
            )}

            {error ? (
              <Alert
                tone="error"
                className="mt-4"
                title="სილაბუსი ვერ დავამუშავე"
                action={
                  canRetry && file ? (
                    <button type="button" onClick={() => void analyze()} className={`inline-flex h-9 items-center rounded-full border border-current/25 px-3.5 text-[13px] font-semibold ${SY_FOCUS}`}>
                      ხელახლა ცდა
                    </button>
                  ) : undefined
                }
              >
                {error}
              </Alert>
            ) : null}
          </section>

          {/* Right: what you get and your syllabi, or the analysis. */}
          <section ref={rightRef} aria-label="შედეგი" aria-busy={loading} className={`${CARD} min-w-0 flex-[999_1_480px] scroll-mt-4 p-5 max-[901px]:basis-full sm:p-7`}>
            {loading ? (
              <Analyzing />
            ) : shown && today ? (
              <div>
                <h2 className="text-[20px] font-bold text-[var(--sy-strong)]">{shown.subject ?? "სილაბუსი"}</h2>
                {shown.insight ? <p className="mt-1 text-[14px] leading-relaxed text-[var(--sy-muted)]">{shown.insight}</p> : null}
                {shown.warnings.length > 0 ? (
                  <Alert tone="warning" className="mt-4" title="შეამოწმე ორიგინალ სილაბუსთან">
                    <ul className="list-disc space-y-1 pl-4">
                      {shown.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </Alert>
                ) : null}
                <div className="mt-5">
                  <SyllabusResult milestones={shownMilestones} picks={picks} today={today} onChangeDate={changeDate} onDelete={removeDate} />
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-[18px] font-bold text-[var(--sy-strong)]">რას მიიღებ</h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  {GAINS.map((gain) => {
                    const Icon = gain.icon;
                    return (
                      <li key={gain.title} className={`rounded-[16px] px-4 py-3.5 ${gain.tone}`}>
                        <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden />
                        <p className="mt-2 text-[14.5px] font-bold">{gain.title}</p>
                        <p className="text-[13px] opacity-90">{gain.text}</p>
                      </li>
                    );
                  })}
                </ul>
                {saved.length > 0 ? (
                  <div className="mt-6 border-t border-[var(--sy-divider)] pt-5">
                    <h3 className="text-[13px] font-semibold text-[var(--sy-muted)]">შენი სილაბუსები</h3>
                    <ul className="mt-2 space-y-0.5">
                      {saved.map((row, index) => (
                        <li key={row.subject ?? "unbound"}>
                          <button
                            type="button"
                            onClick={() => reopen(row)}
                            className={`flex w-full items-center gap-3 rounded-[12px] px-2 py-2.5 text-left transition-colors hover:bg-[var(--sy-soft)] ${SY_FOCUS}`}
                          >
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.subject ? SUBJECT_DOTS[index % SUBJECT_DOTS.length] : "var(--sy-muted)" }} aria-hidden />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14.5px] font-semibold text-[var(--sy-strong)]">{row.subject ?? "საგნის გარეშე"}</span>
                              <span className="block text-[12.5px] text-[var(--sy-muted)]">
                                {row.count} თარიღი{row.next ? ` · შემდეგი: ${row.next.label}` : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
