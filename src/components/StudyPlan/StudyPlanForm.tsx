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
      className="dashboard-section flex flex-col gap-4 p-5 backdrop-blur-md"
    >
      <label className="block space-y-1 text-sm">
        <span className="text-slate-600 dark:text-zinc-400">საგანი</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="tool-input focus:border-purple-500/50"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-slate-600 dark:text-zinc-400">თემები</span>
        <textarea
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
          required
          className="tool-input min-h-28 focus:border-purple-500/50"
        />
      </label>
      <div className="space-y-1 text-sm">
        <label className="space-y-1 text-sm">
          <span className="text-slate-600 dark:text-zinc-400">გამოცდის თარიღი</span>
          <input
            type="date"
            value={examDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setExamDate(e.target.value)}
            required
            className="tool-input focus:border-purple-500/50"
          />
        </label>
        <p className="text-xs text-slate-500 dark:text-zinc-500">
          AI დააგენერირებს მაქს. 30 დღის გეგმას (უახლოესი პერიოდი გამოცდამდე).
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-600 dark:text-zinc-400">დღეში სასწავლო დრო</p>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((hour) => {
            const isActive = hoursPerDay === hour;
            return (
              <button
                key={hour}
                type="button"
                onClick={() => setHoursPerDay(hour)}
                className={`rounded-xl border px-2 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "border-violet-400/60 bg-gradient-to-br from-violet-50 to-indigo-50 text-violet-700 shadow-md shadow-violet-100 dark:border-purple-500/40 dark:bg-purple-500/20 dark:text-purple-200 dark:shadow-[0_0_0_1px_rgba(168,85,247,0.4),0_10px_24px_rgba(168,85,247,0.22)]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-700 dark:border-white/[0.08] dark:bg-[#161619] dark:text-zinc-300 dark:hover:border-purple-500/20 dark:hover:text-white"
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
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "გეგმა იქმნება..." : "გეგმის გენერაცია"}
      </button>
    </form>
  );
}
