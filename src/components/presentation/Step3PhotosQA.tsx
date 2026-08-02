"use client";

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
      <h2 className="headline text-xl font-semibold text-zinc-100">
        Step 3 — ფოტოები & Q&A
      </h2>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <p className="text-sm text-zinc-400">
          Step 3 ამ ეტაპზე კონცენტრირებულია Q&A პარამეტრებზე.
        </p>
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
          <span className="text-zinc-400">რა არის ყველაზე მნიშვნელოვანი?</span>
          <input
            value={qa.mainPoint}
            onChange={(e) => onQaChange({ mainPoint: e.target.value })}
            className="w-full rounded-xl border border-white/[0.08] bg-[#121214]/60 px-4 py-3 text-white outline-none transition-all focus:border-purple-500/50"
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
      <span className="text-zinc-400">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`rounded-full border px-3 py-1 text-xs transition-all ${
                active
                  ? "border-purple-500/40 bg-purple-500/10 text-purple-400 shadow-sm"
                  : "border-white/[0.06] bg-white/[0.02] text-gray-400 hover:text-white"
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
