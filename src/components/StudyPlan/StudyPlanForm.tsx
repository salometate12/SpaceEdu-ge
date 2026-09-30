"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { studyPlanCardClass, studyPlanFieldClass, studyPlanLabelClass } from "./study-plan-styles";

export interface StudyPlanFormValues {
  subject: string;
  topics: string;
  examDate: string;
  hoursPerDay: number;
}

interface StudyPlanFormProps {
  loading: boolean;
  onSubmit: (values: StudyPlanFormValues) => Promise<void>;
}

const HOURS = [1, 2, 3, 4];

export function StudyPlanForm({ loading, onSubmit }: StudyPlanFormProps) {
  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(2);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ subject, topics, examDate, hoursPerDay });
  };

  return (
    <form onSubmit={handleSubmit} className={`${studyPlanCardClass} flex flex-col gap-5`}>
      <label className="flex flex-col gap-1.5">
        <span className={studyPlanLabelClass}>საგანი</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className={`${studyPlanFieldClass} h-11`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={studyPlanLabelClass}>თემები</span>
        <textarea
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          required
          className={`${studyPlanFieldClass} min-h-28 py-2.5 leading-relaxed`}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5">
          <span className={studyPlanLabelClass}>გამოცდის თარიღი</span>
          <input
            type="date"
            value={examDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setExamDate(e.target.value)}
            required
            className={`${studyPlanFieldClass} h-11`}
          />
        </label>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          AI დააგენერირებს მაქს. 30 დღის გეგმას (უახლოესი პერიოდი გამოცდამდე).
        </p>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className={`${studyPlanLabelClass} mb-1.5`}>დღეში სასწავლო დრო</legend>
        {/* One chip is selected at a time. Hover stays neutral: it used to
            look exactly like "selected", so a hovered chip read as a second
            selection. */}
        <div role="radiogroup" className="grid grid-cols-4 gap-2">
          {HOURS.map((hour) => {
            const isActive = hoursPerDay === hour;
            return (
              <button
                key={hour}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setHoursPerDay(hour)}
                className={`h-10 rounded-xl border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/25 ${
                  isActive
                    ? "border-[var(--accent-primary)] bg-pink-50 font-medium text-[var(--accent-primary)] dark:bg-pink-400/15 dark:text-pink-300"
                    : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-stone-50 dark:border-white/10 dark:bg-transparent dark:hover:border-white/20 dark:hover:bg-white/[0.04]"
                }`}
              >
                {hour} სთ
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-primary)] text-sm font-semibold text-white transition-[background-color,opacity] hover:bg-[color-mix(in_srgb,var(--accent-primary)_88%,black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {loading ? "გეგმა იქმნება..." : "გეგმის გენერაცია"}
      </button>
    </form>
  );
}
