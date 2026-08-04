"use client";

import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { Dices, Plus, X } from "lucide-react";
import { STUDY_PLAN_SUBJECTS } from "@/lib/study-plan-subjects";
import { pickEstimatedExamDate } from "@/lib/study-plan-estimated-date";
import type { StudyPlanFormValues } from "./StudyPlanForm";

interface AbitStudyPlanFormProps {
  loading: boolean;
  onSubmit: (values: StudyPlanFormValues) => Promise<void>;
}

const HOURS_OPTIONS = [1, 2, 3, 4];

export function AbitStudyPlanForm({ loading, onSubmit }: AbitStudyPlanFormProps) {
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [isCustomHours, setIsCustomHours] = useState(false);

  const subject = useMemo(
    () => STUDY_PLAN_SUBJECTS.find((item) => item.id === subjectId) ?? null,
    [subjectId],
  );

  const suggestedTopics = subject?.suggestedTopics ?? [];
  const customTopics = selectedTopics.filter((topic) => !suggestedTopics.includes(topic));

  const selectSubject = (id: string) => {
    setSubjectId(id);
    setSelectedTopics([]);
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((item) => item !== topic) : [...prev, topic],
    );
  };

  const addCustomTopic = () => {
    const trimmed = customTopic.trim();
    if (!trimmed || selectedTopics.includes(trimmed)) {
      setCustomTopic("");
      return;
    }
    setSelectedTopics((prev) => [...prev, trimmed]);
    setCustomTopic("");
  };

  const handleCustomTopicKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomTopic();
    }
  };

  const applyEstimatedDate = () => {
    setExamDate(pickEstimatedExamDate());
  };

  const canSubmit = Boolean(subject) && selectedTopics.length > 0 && Boolean(examDate);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subject || !canSubmit) return;
    await onSubmit({
      subject: subject.title,
      topics: selectedTopics.join(", "),
      examDate,
      hoursPerDay,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="dashboard-section flex flex-col gap-5 p-5 backdrop-blur-md"
    >
      <div className="space-y-2">
        <span className="text-sm text-slate-600 dark:text-zinc-400">საგანი</span>
        <div className="flex flex-wrap gap-2">
          {STUDY_PLAN_SUBJECTS.map((item) => {
            const Icon = item.icon;
            const active = item.id === subjectId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectSubject(item.id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all active:scale-[0.97] ${
                  active
                    ? `${item.theme.iconRing} ${item.theme.iconText}`
                    : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-white/[0.08] dark:bg-[#161619] dark:text-zinc-300 dark:hover:border-purple-500/25"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {item.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm text-slate-600 dark:text-zinc-400">თემები</span>

        {subject ? (
          <>
            {suggestedTopics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.map((topic) => {
                  const active = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
                        active
                          ? `${subject.theme.iconRing} ${subject.theme.iconText}`
                          : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 dark:border-white/[0.08] dark:bg-[#161619] dark:text-zinc-400 dark:hover:border-purple-500/25"
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            )}

            {customTopics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customTopics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/60 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-200"
                  >
                    {topic}
                    <button
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      aria-label={`${topic} — წაშლა`}
                      className="rounded-full p-0.5 transition hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                value={customTopic}
                onChange={(event) => setCustomTopic(event.target.value)}
                onKeyDown={handleCustomTopicKeyDown}
                placeholder="დაამატე სხვა თემა..."
                className="tool-input flex-1 focus:border-purple-500/50"
              />
              <button
                type="button"
                onClick={addCustomTopic}
                disabled={!customTopic.trim()}
                aria-label="თემის დამატება"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:border-purple-500/25 dark:hover:text-white"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500 dark:border-white/[0.08] dark:text-zinc-500">
            ჯერ აირჩიე საგანი — თემები აქ გამოჩნდება
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <span className="text-sm text-slate-600 dark:text-zinc-400">გამოცდის თარიღი</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={examDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setExamDate(event.target.value)}
            required
            className="tool-input flex-1 focus:border-purple-500/50"
          />
          <button
            type="button"
            onClick={applyEstimatedDate}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-300/50 bg-violet-50 px-3 py-2.5 text-xs font-medium text-violet-700 transition hover:bg-violet-100 dark:border-purple-500/25 dark:bg-purple-500/10 dark:text-purple-200 dark:hover:bg-purple-500/20"
          >
            <Dices className="h-3.5 w-3.5" strokeWidth={2} />
            სავარაუდო
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-500">
          ჯერ არ იცი ზუსტი თარიღი? „სავარაუდო“ ივლისში შემთხვევით თარიღს შემოგთავაზებს — მოგვიანებით
          გამოასწორებ.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-600 dark:text-zinc-400">დღეში სასწავლო დრო</p>
        <div className="flex flex-wrap gap-2">
          {HOURS_OPTIONS.map((hour) => {
            const isActive = !isCustomHours && hoursPerDay === hour;
            return (
              <button
                key={hour}
                type="button"
                onClick={() => {
                  setIsCustomHours(false);
                  setHoursPerDay(hour);
                }}
                aria-pressed={isActive}
                className={`min-w-[3.25rem] rounded-xl border px-3 py-2 text-sm font-medium transition-all active:scale-[0.97] ${
                  isActive
                    ? "border-violet-400/60 bg-violet-50 text-violet-700 dark:border-purple-400/50 dark:bg-purple-500/15 dark:text-purple-200"
                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-700 dark:border-white/[0.08] dark:bg-[#161619] dark:text-zinc-300 dark:hover:border-purple-500/20 dark:hover:text-white"
                }`}
              >
                {hour} სთ
              </button>
            );
          })}

          <label
            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
              isCustomHours
                ? "border-violet-400/60 bg-violet-50 text-violet-700 dark:border-purple-400/50 dark:bg-purple-500/15 dark:text-purple-200"
                : "border-dashed border-slate-300 bg-white text-slate-500 hover:border-violet-300 hover:text-violet-700 dark:border-white/15 dark:bg-[#161619] dark:text-zinc-400 dark:hover:border-purple-500/20 dark:hover:text-white"
            }`}
          >
            <input
              type="number"
              inputMode="numeric"
              min={5}
              max={8}
              placeholder="5+"
              value={isCustomHours ? hoursPerDay : ""}
              onChange={(event) => {
                const raw = event.target.value;
                if (!raw) {
                  setIsCustomHours(false);
                  return;
                }
                const value = Number(raw);
                if (Number.isNaN(value)) return;
                setIsCustomHours(true);
                setHoursPerDay(Math.min(8, Math.max(1, Math.round(value))));
              }}
              className="w-8 bg-transparent text-center outline-none [appearance:textfield] placeholder:text-slate-400 dark:placeholder:text-zinc-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span>სთ</span>
          </label>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-500">
          გინდა 5-6 საათი ან მეტი? ჩაწერე ხელით ბოლო ველში.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "გეგმა იქმნება..." : "გეგმის გენერაცია"}
      </button>
    </form>
  );
}
