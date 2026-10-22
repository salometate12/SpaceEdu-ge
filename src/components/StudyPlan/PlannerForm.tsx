"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Check, Loader2, Plus, RotateCw, X } from "lucide-react";
import { FieldError } from "@/components/ui/Alert";
import { checkStudyPlanForm, daysUntil, splitTopics, type StudyPlanFormCheck } from "@/lib/study-plan-board";
import { SP_FIELD, SP_FOCUS, SP_LABEL, SP_PRIMARY } from "./planner-styles";

export interface PlannerValues {
  subject: string;
  examDate: string;
  hoursPerDay: number;
  topics: string[];
}

const HOURS = [1, 2, 3, 4];

/** Subject: type freely, or pick one of the semester subjects. */
function SubjectField({
  value,
  onChange,
  subjects,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  subjects: string[];
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const term = value.trim().toLowerCase();
  const options = subjects.filter((subject) => !term || subject.toLowerCase().includes(term) || subject === value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={`${id}-input`} className={SP_LABEL}>
        საგანი
      </label>
      <input
        id={`${id}-input`}
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="off"
        value={value}
        placeholder="აირჩიე ან ჩაწერე"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className={`${SP_FIELD} mt-1.5`}
      />
      {open && options.length > 0 ? (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label="სემესტრის საგნები"
          className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-[14px] border border-[var(--sp-line)] bg-[var(--sp-card)] p-1.5 shadow-[0_12px_32px_-14px_rgb(15_23_42/0.3)]"
        >
          {options.map((subject) => (
            <li key={subject} role="option" aria-selected={subject === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(subject);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-left text-[15px] text-[var(--sp-strong)] transition-colors hover:bg-[var(--sp-soft)] ${SP_FOCUS}`}
              >
                {subject}
                {subject === value ? <Check className="h-4 w-4 text-[var(--sp-accent)]" aria-hidden /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

/** Topics as chips: Enter or a comma adds, × removes. */
function TopicsField({ topics, onChange }: { topics: string[]; onChange: (topics: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const id = useId();
  const commit = () => {
    if (!draft.trim()) return;
    onChange(splitTopics(draft, topics));
    setDraft("");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && !draft && topics.length > 0) {
      onChange(topics.slice(0, -1));
    }
  };
  return (
    <div>
      <label htmlFor={id} className={SP_LABEL}>
        თემები <span className="font-normal">(არასავალდებულო)</span>
      </label>
      <div className="mt-1.5 flex min-h-11 flex-wrap items-center gap-1.5 rounded-[14px] border border-[var(--sp-line)] bg-[var(--sp-card)] px-2 py-1.5 transition-colors focus-within:border-[var(--sp-strong)]">
        {topics.map((topic) => (
          <span key={topic} className="inline-flex h-8 max-w-full items-center gap-1 rounded-full bg-[var(--sp-soft)] pl-3 pr-1 text-[13.5px] font-medium text-[var(--sp-strong)]">
            <span className="truncate">{topic}</span>
            <button
              type="button"
              onClick={() => onChange(topics.filter((item) => item !== topic))}
              aria-label={`წაშალე: ${topic}`}
              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--sp-muted)] transition-colors hover:bg-[var(--sp-card)] hover:text-[var(--sp-strong)] ${SP_FOCUS}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <span className="inline-flex min-w-[10rem] flex-1 items-center gap-1 pl-1.5 text-[var(--sp-muted)]">
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          <input
            id={id}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={commit}
            placeholder="დაამატე თემა"
            className="h-8 min-w-0 flex-1 bg-transparent text-[16px] text-[var(--sp-strong)] outline-none placeholder:text-[var(--sp-muted)] sm:text-[14.5px]"
          />
        </span>
      </div>
    </div>
  );
}

/**
 * The form in one card: subject, exam date (with the days left), hours a
 * day and the main button in one row; the topics under it. Its own
 * Georgian messages instead of the browser's.
 */
export function PlannerForm({
  values,
  onChange,
  subjects,
  today,
  loading,
  hasPlan,
  topicsFromSyllabus,
  onSubmit,
}: {
  values: PlannerValues;
  onChange: (values: PlannerValues) => void;
  subjects: string[];
  today: string;
  loading: boolean;
  hasPlan: boolean;
  /** The topics were filled from the subject's syllabus. */
  topicsFromSyllabus: boolean;
  onSubmit: () => void;
}) {
  const [check, setCheck] = useState<StudyPlanFormCheck | null>(null);
  const dateId = useId();
  const set = (patch: Partial<PlannerValues>) => onChange({ ...values, ...patch });
  // After a first try, messages follow the input.
  const shown = check ? checkStudyPlanForm(values, today) : null;
  const daysLeft = values.examDate ? daysUntil(values.examDate, today) : null;
  const longRange = values.examDate ? checkStudyPlanForm(values, today).longRange : false;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = checkStudyPlanForm(values, today);
    setCheck(result);
    if (result.subject || result.examDate) return;
    onSubmit();
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 items-start gap-3 md:flex md:flex-wrap md:items-start">
        <div className="col-span-2 md:min-w-[220px] md:flex-[2_1_220px]">
          <SubjectField value={values.subject} onChange={(subject) => set({ subject })} subjects={subjects} error={shown?.subject} />
        </div>

        <div className="md:min-w-[170px] md:flex-[1_1_170px]">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor={dateId} className={SP_LABEL}>
              გამოცდა
            </label>
            {daysLeft !== null && daysLeft > 0 ? (
              <span className="text-[12.5px] font-semibold tabular-nums text-[var(--sp-muted)]">{daysLeft} დღე</span>
            ) : null}
          </div>
          <input
            id={dateId}
            type="date"
            value={values.examDate}
            min={today}
            onChange={(event) => set({ examDate: event.target.value })}
            aria-invalid={Boolean(shown?.examDate)}
            aria-describedby={shown?.examDate ? `${dateId}-error` : undefined}
            className={`${SP_FIELD} mt-1.5`}
          />
          <FieldError id={`${dateId}-error`}>{shown?.examDate}</FieldError>
        </div>

        <div className="md:min-w-[200px] md:flex-[1_1_200px]">
          <p className={SP_LABEL} id={`${dateId}-hours`}>
            დღეში
          </p>
          {/* Phones: a select; wider: a segmented control. */}
          <select
            aria-labelledby={`${dateId}-hours`}
            value={values.hoursPerDay}
            onChange={(event) => set({ hoursPerDay: Number(event.target.value) })}
            className={`${SP_FIELD} mt-1.5 md:hidden`}
          >
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hour} სთ
              </option>
            ))}
          </select>
          <div role="group" aria-labelledby={`${dateId}-hours`} className="mt-1.5 hidden h-11 gap-1 rounded-[14px] bg-[var(--sp-soft)] p-1 md:flex">
            {HOURS.map((hour) => {
              const active = values.hoursPerDay === hour;
              return (
                <button
                  key={hour}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ hoursPerDay: hour })}
                  className={`flex-1 rounded-[10px] text-[13.5px] transition-colors ${SP_FOCUS} ${
                    active
                      ? "bg-[var(--sp-seg-active)] font-bold text-[var(--sp-strong)] shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                      : "font-medium text-[var(--sp-muted)] hover:text-[var(--sp-strong)]"
                  }`}
                >
                  {hour} სთ
                </button>
              );
            })}
          </div>
        </div>

        <div className="col-span-2 md:flex-[0_0_auto] md:pt-[1.6rem]">
          <button type="submit" disabled={loading} className={`${SP_PRIMARY} w-full md:w-auto`}>
            {loading ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin motion-reduce:animate-none" aria-hidden />
            ) : hasPlan ? (
              <RotateCw className="h-[18px] w-[18px]" strokeWidth={2.4} aria-hidden />
            ) : null}
            {loading ? "ვადგენ…" : hasPlan ? "განახლება" : "გეგმის შექმნა"}
          </button>
        </div>
      </div>

      <TopicsField topics={values.topics} onChange={(topics) => set({ topics })} />
      {topicsFromSyllabus && values.topics.length > 0 ? (
        <p className="-mt-2 flex items-center gap-1.5 text-[13px] font-medium text-[var(--sp-ok-text)]">
          <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
          თემები სილაბუსიდან ავიღე — შეგიძლია წაშალო ან დაამატო
        </p>
      ) : null}
      {longRange ? (
        <p className="-mt-2 text-[13px] text-[var(--sp-muted)]">გამოცდამდე 30 დღეზე მეტია — გეგმას უახლოეს 30 დღეზე შევადგენ.</p>
      ) : null}
    </form>
  );
}
