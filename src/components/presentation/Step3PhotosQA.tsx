"use client";

import { HelpCircle } from "lucide-react";

interface Step3PhotosQAProps {
  qa: {
    goal: string;
    audience: string;
    tone: string;
    mainPoint: string;
  };
  onQaChange: (qa: Partial<{
    goal: string;
    audience: string;
    tone: string;
    mainPoint: string;
  }>) => void;
}

const OPTIONS = {
  goal: ["ცნების განმარტება", "არგუმენტის დამტკიცება", "ისტორიის მიმოხილვა", "კვლევის წარდგენა"],
  audience: ["კლასელები", "პროფესორი", "კომისია", "შერეული"],
  tone: ["აკადემიური", "მეგობრული", "ფორმალური", "კრეატიული"],
};

export function Step3PhotosQA({
  qa,
  onQaChange,
}: Step3PhotosQAProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="subject-icon-wrap flex h-9 w-9 shrink-0 items-center justify-center text-violet-600 dark:text-violet-400">
          <HelpCircle className="h-4 w-4" />
        </span>
        <div>
          <h2 className="headline text-xl font-semibold text-slate-900 dark:text-zinc-100">
            დეტალები
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            რამდენიმე კითხვა, რომ AI-მ ტექსტი შენს მიზანს მოარგოს
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <QASelect
          label="რა არის შენი პრეზენტაციის მთავარი მიზანი?"
          value={qa.goal}
          options={OPTIONS.goal}
          onChange={(value) => onQaChange({ goal: value })}
        />
        <QASelect
          label="ვინ არის შენი აუდიტორია?"
          value={qa.audience}
          options={OPTIONS.audience}
          onChange={(value) => onQaChange({ audience: value })}
        />
        <QASelect
          label="რა ტონი გინდა?"
          value={qa.tone}
          options={OPTIONS.tone}
          onChange={(value) => onQaChange({ tone: value })}
        />
        <label className="space-y-1 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">
            რა არის ყველაზე მნიშვნელოვანი?
          </span>
          <input
            value={qa.mainPoint}
            onChange={(e) => onQaChange({ mainPoint: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-violet-400/50 dark:focus:ring-violet-500/10"
            placeholder="შეიყვანე მთავარი პუნქტი..."
          />
        </label>
      </div>
    </section>
  );
}

function QASelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                active
                  ? "border-violet-300 bg-violet-50 text-violet-700 shadow-sm dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-300"
                  : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-400 dark:hover:border-violet-400/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
