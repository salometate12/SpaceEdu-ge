"use client";

import { FileText } from "lucide-react";
import type { PresentationForm } from "./PresentationWizard";

interface Step1InfoProps {
  form: PresentationForm;
  onChange: (next: Partial<PresentationForm>) => void;
}

export function Step1Info({ form, onChange }: Step1InfoProps) {
  const quickTags = ["+ სტატისტიკა", "+ მოკლე", "+ მაგალითები", "+ აკადემიური"];
  const options = {
    slideCount: [5, 8, 10, 12, 15],
    level: ["სკოლა", "ეროვნულები", "უნივერსიტეტი"],
    language: [
      { value: "ქართული", label: "🇬🇪 ქართული" },
      { value: "ინგლისური", label: "🇬🇧 English" },
      { value: "ქართული + ინგლისური", label: "🌍 ორივე" },
    ],
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-violet-400/50 dark:focus:ring-violet-500/10";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500";
  const pillActive =
    "border-amber-200 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-400";
  const pillInactive =
    "border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-400 dark:hover:border-amber-400/30 dark:hover:bg-amber-500/10 dark:hover:text-amber-400";

  const toggleTag = (tag: string) => {
    const hasTag = form.extraInstructions.includes(tag);
    if (hasTag) {
      onChange({
        extraInstructions: form.extraInstructions
          .replace(tag, "")
          .replace(/\s{2,}/g, " ")
          .trim(),
      });
      return;
    }
    onChange({
      extraInstructions: `${form.extraInstructions} ${tag}`.trim(),
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="subject-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center text-amber-600 dark:text-amber-400">
          <FileText className="h-4 w-4" />
        </span>
        <h2 className="headline text-xl font-semibold text-slate-900 dark:text-zinc-100">
          Step 1 — ინფორმაცია
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className={labelClass}>თემა</span>
          <input
            value={form.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className={labelClass}>საგანი</span>
          <input
            value={form.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>

      <div className="space-y-3">
        <p className={labelClass}>სლაიდები</p>
        <div className="flex flex-wrap gap-2">
          {options.slideCount.map((count) => {
            const active = form.slideCount === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => onChange({ slideCount: count })}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active ? pillActive : pillInactive
                }`}
              >
                {count} სლაიდი
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className={labelClass}>დონე</p>
        <div className="flex flex-wrap gap-2">
          {options.level.map((level) => {
            const active = form.level === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => onChange({ level })}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active ? pillActive : pillInactive
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className={labelClass}>ენა</p>
        <div className="flex flex-wrap gap-2">
          {options.language.map((language) => {
            const active = form.language === language.value;
            return (
              <button
                key={language.value}
                type="button"
                onClick={() => onChange({ language: language.value })}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active ? pillActive : pillInactive
                }`}
              >
                {language.label}
              </button>
            );
          })}
        </div>
      </div>
      <label className="space-y-1 text-sm">
        <span className={labelClass}>დამატებითი მითითებები</span>
        <textarea
          value={form.extraInstructions}
          onChange={(e) => onChange({ extraInstructions: e.target.value })}
          className={`min-h-24 ${inputClass}`}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {quickTags.map((tag) => {
          const active = form.extraInstructions.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs transition ${
                active ? pillActive : pillInactive
              }`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </section>
  );
}
