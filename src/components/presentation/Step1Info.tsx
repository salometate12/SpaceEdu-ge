"use client";

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
      <h2 className="headline text-xl font-semibold text-zinc-100">Step 1 — ინფორმაცია</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">თემა</span>
          <input
            value={form.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
            className="w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-3 text-white outline-none transition-all focus:border-purple-500/50"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-zinc-400">საგანი</span>
          <input
            value={form.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
            className="w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-3 text-white outline-none transition-all focus:border-purple-500/50"
          />
        </label>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-zinc-400">სლაიდები</p>
        <div className="flex flex-wrap gap-2">
          {options.slideCount.map((count) => {
            const active = form.slideCount === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => onChange({ slideCount: count })}
                className={`rounded-full px-3 py-1 text-xs transition-all ${
                  active
                    ? "border border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-sm"
                    : "border border-white/[0.06] bg-white/[0.02] text-gray-400 hover:text-white"
                }`}
              >
                {count} სლაიდი
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-zinc-400">დონე</p>
        <div className="flex flex-wrap gap-2">
          {options.level.map((level) => {
            const active = form.level === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => onChange({ level })}
                className={`rounded-full px-3 py-1 text-xs transition-all ${
                  active
                    ? "border border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-sm"
                    : "border border-white/[0.06] bg-white/[0.02] text-gray-400 hover:text-white"
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-zinc-400">ენა</p>
        <div className="flex flex-wrap gap-2">
          {options.language.map((language) => {
            const active = form.language === language.value;
            return (
              <button
                key={language.value}
                type="button"
                onClick={() => onChange({ language: language.value })}
                className={`rounded-full px-3 py-1 text-xs transition-all ${
                  active
                    ? "border border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-sm"
                    : "border border-white/[0.06] bg-white/[0.02] text-gray-400 hover:text-white"
                }`}
              >
                {language.label}
              </button>
            );
          })}
        </div>
      </div>
      <label className="space-y-1 text-sm">
        <span className="text-zinc-400">დამატებითი მითითებები</span>
        <textarea
          value={form.extraInstructions}
          onChange={(e) => onChange({ extraInstructions: e.target.value })}
          className="min-h-24 w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-3 text-white outline-none transition-all focus:border-purple-500/50"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {quickTags.map((tag) => {
          const active = form.extraInstructions.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs transition-all ${
                active
                  ? "border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-sm"
                  : "border-white/[0.06] bg-white/[0.02] text-gray-400 hover:text-white"
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
