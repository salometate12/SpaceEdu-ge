"use client";

import { useState, type FormEvent } from "react";

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
    <form
      onSubmit={handleSubmit}
      className="dashboard-tool-card flex flex-col gap-4 rounded-[28px] p-5"
    >
      <label className="block space-y-1.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">
          საგანი
        </span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-violet-400/50 dark:focus:ring-violet-500/10"
        />
      </label>
      <label className="block space-y-1.5 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">
          თემები
        </span>
        <textarea
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          required
          className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-violet-400/50 dark:focus:ring-violet-500/10"
        />
      </label>
      <div className="space-y-1.5 text-sm">
        <label className="block space-y-1.5 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">
            გამოცდის თარიღი
          </span>
          <input
            type="date"
            value={examDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setExamDate(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-violet-400/50 dark:focus:ring-violet-500/10"
          />
        </label>
        <p className="text-xs text-slate-500 dark:text-zinc-500">
          AI დააგენერირებს მაქს. 30 დღის გეგმას (უახლოესი პერიოდი გამოცდამდე).
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">
          დღეში სასწავლო დრო
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((hour) => {
            const isActive = hoursPerDay === hour;
            return (
              <button
                key={hour}
                type="button"
                onClick={() => setHoursPerDay(hour)}
                className={`rounded-xl border px-2 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-400/50 dark:bg-violet-500/10 dark:text-violet-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-violet-400/30 dark:hover:bg-violet-500/10 dark:hover:text-white"
                }`}
              >
                {hour} სთ
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:hover:bg-violet-400"
      >
        {loading ? "გეგმა იქმნება..." : "გეგმის გენერაცია"}
      </button>
    </form>
  );
}
