"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Lock,
  Plus,
  Search,
} from "lucide-react";

type Step = 1 | 2 | 3;

const ELECTIVES = [
  "ისტორია",
  "მათემატიკა",
  "ბიოლოგია",
  "ქიმია",
  "ფიზიკა",
  "გეოგრაფია",
  "სამოქალაქო",
] as const;

const SUBJECT_MAX: Record<string, number> = {
  "ქართული ენა და ლიტერატურა": 60,
  "ინგლისური ენა": 60,
  ისტორია: 60,
  მათემატიკა: 51,
  ბიოლოგია: 60,
  ქიმია: 60,
  ფიზიკა: 51,
  გეოგრაფია: 60,
  სამოქალაქო: 60,
};

const PROGRAMS = [
  { code: "0010101", title: "კომპიუტერული მეცნიერება", institution: "თსუ" },
  { code: "0010102", title: "ინფორმაციული ტექნოლოგიები", institution: "ილიაუნი" },
  { code: "0010103", title: "ბიზნესის ადმინისტრირება", institution: "GIPA" },
  { code: "0010104", title: "საერთაშორისო ურთიერთობები", institution: "სეუ" },
];

export function UniCalculatorWizard() {
  const [step, setStep] = useState<Step>(1);
  const [electives, setElectives] = useState<string[]>(["მათემატიკა"]);
  const [scores, setScores] = useState<Record<string, number>>({
    "ქართული ენა და ლიტერატურა": 45,
    "ინგლისური ენა": 42,
    მათემატიკა: 39,
  });
  const [query, setQuery] = useState("");
  const [pickedPrograms, setPickedPrograms] = useState<string[]>([]);

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  const scoreSubjects = useMemo(
    () => ["ქართული ენა და ლიტერატურა", "ინგლისური ენა", ...electives],
    [electives],
  );

  const filteredPrograms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROGRAMS;
    return PROGRAMS.filter(
      (program) =>
        program.code.includes(q) ||
        program.title.toLowerCase().includes(q) ||
        program.institution.toLowerCase().includes(q),
    );
  }, [query]);

  const toggleElective = (subject: string) => {
    setElectives((prev) =>
      prev.includes(subject) ? prev.filter((item) => item !== subject) : [...prev, subject],
    );
    setScores((prev) => ({ ...prev, [subject]: prev[subject] ?? 30 }));
  };

  const goNext = () => setStep((prev) => (prev < 3 ? ((prev + 1) as Step) : prev));
  const goBack = () => setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#121214]/60 p-5 backdrop-blur-xl sm:p-6">
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">
          <span className="sr-only">პროგრესი</span>
          <span className="font-medium text-indigo-300">{progress}%</span>
          <span>
            {step}/3
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
        <div className="grid gap-2 sm:grid-cols-3">
          <StepPill id={1} title="კონფიგურაცია" active={step === 1} icon={BookOpen} />
          <StepPill id={2} title="ქულები" active={step === 2} icon={GraduationCap} />
          <StepPill id={3} title="ფილტრაცია" active={step === 3} icon={Search} />
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="mt-6 text-2xl font-bold text-white">რა საგნებს აბარებ?</h2>
          <p className="mt-1 mb-6 text-sm text-gray-400">
            მონიშნე შენი საგამოცდო მიმართულებები
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#121214]/60 p-4 text-sm text-white/80">
              <span>ქართული ენა და ლიტერატურა</span>
              <Lock className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.5} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-violet-500/40 bg-violet-500/10 p-4 text-sm text-white shadow-[0_0_20px_rgba(139,92,246,0.12)]">
              <span>ინგლისური ენა</span>
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-violet-400/50 bg-violet-600 text-white">
                <Check className="h-3 w-3 stroke-[2]" />
              </span>
            </div>

            {ELECTIVES.map((subject) => {
              const selected = electives.includes(subject);
              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggleElective(subject)}
                  className={`rounded-xl border p-4 text-left text-sm transition-all hover:bg-white/[0.04] ${
                    selected
                      ? "border-violet-500/40 bg-violet-500/10 text-white"
                      : "border-white/[0.06] bg-[#121214]/60 text-white"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    {subject}
                    {selected && (
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                        <Check className="h-3 w-3 stroke-[2]" />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">რა ქულებს ელოდები?</h2>
          <p className="text-sm text-gray-400">დაარეგულირე სავარაუდო ქულები თითო საგანზე</p>
          <div className="space-y-3">
            {scoreSubjects.map((subject) => (
              <div
                key={subject}
                className="grid items-center gap-3 rounded-xl border border-white/[0.06] bg-[#121214]/60 p-4 sm:grid-cols-[1fr_150px]"
              >
                <div>
                  <p className="text-sm text-zinc-200">
                    {subject} — მაქს. {SUBJECT_MAX[subject] ?? 60}
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={SUBJECT_MAX[subject] ?? 60}
                    value={scores[subject] ?? 0}
                    onChange={(event) =>
                      setScores((prev) => ({
                        ...prev,
                        [subject]: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full accent-violet-500"
                  />
                </div>
                <div className="inline-flex justify-center rounded-xl border border-white/[0.06] bg-black/20 px-4 py-2 font-mono text-sm text-white">
                  {scores[subject] ?? 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">სასურველი პროგრამების შერჩევა</h2>
          <p className="text-sm text-gray-400">მოძებნე პროგრამა კოდით ან დაწესებულებით</p>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 stroke-[1.5]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ძებნა სახელით ან კოდით..."
              className="w-full rounded-xl border border-white/[0.06] bg-[#121214]/60 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition focus:border-violet-500/50"
            />
          </label>

          <div className="space-y-2">
            {filteredPrograms.map((program) => (
              <div
                key={program.code}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#121214]/60 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 font-mono text-xs text-zinc-300">
                      {program.code}
                    </span>
                    <p className="truncate text-sm text-white">{program.title}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-400">{program.institution}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPickedPrograms((prev) =>
                      prev.includes(program.code)
                        ? prev.filter((code) => code !== program.code)
                        : [...prev, program.code],
                    )
                  }
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                    pickedPrograms.includes(program.code)
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                      : "border-white/[0.06] bg-white/[0.03] text-zinc-400"
                  }`}
                >
                  {pickedPrograms.includes(program.code) ? (
                    <Check className="h-4 w-4 stroke-[1.5]" />
                  ) : (
                    <Plus className="h-4 w-4 stroke-[1.5]" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-transparent px-4 py-2.5 text-xs font-medium text-gray-400 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[1.5]" />
          უკან
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={step === 3}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
        >
          შემდეგი
          <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
        </button>
      </footer>
    </section>
  );
}

function StepPill({
  id,
  title,
  active,
  icon: Icon,
}: {
  id: number;
  title: string;
  active: boolean;
  icon: typeof BookOpen;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-all ${
        active
          ? "border-indigo-500/35 bg-indigo-500/10 text-indigo-200"
          : "border-transparent bg-transparent text-zinc-500"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
      <span className="text-xs font-medium">
        {id}. {title}
      </span>
    </div>
  );
}
