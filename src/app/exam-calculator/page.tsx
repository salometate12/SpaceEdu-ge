"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { ExamPredictionCard } from "@/components/abiturient/ExamPredictionCard";
import { DASHBOARD_ABIT_HREF } from "@/lib/dashboard-routes";
import { compatibilityLabel } from "@/lib/exam-calculator/prediction-status";
import { SCORE_FIELDS } from "@/lib/exam-calculator/subjects";
import type {
  CalculatorMatch,
  CalculatorPrediction,
} from "@/lib/exam-calculator/types";

type WizardStep = 1 | 2 | 3;

const STEP_LABELS: Record<WizardStep, string> = {
  1: "ქულები",
  2: "არჩევანი",
  3: "პროგნოზი",
};

const initialScores = (): Record<string, number> => {
  const base: Record<string, number> = {
    georgian: 0,
    foreign_language: 0,
  };
  for (const field of SCORE_FIELDS) {
    if (base[field.id] == null) base[field.id] = 0;
  }
  return base;
};

function buildPayloadScores(
  scores: Record<string, number>,
  activeFields: string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of activeFields) {
    if (scores[id] != null && scores[id] > 0) out[id] = scores[id];
  }
  if (scores.georgian > 0) out.georgian = scores.georgian;
  if (scores.foreign_language > 0) out.foreign_language = scores.foreign_language;
  return out;
}

function groupByUniversity(results: CalculatorMatch[]) {
  const map = new Map<
    string,
    { university: string; programs: CalculatorMatch[] }
  >();
  for (const program of results) {
    const key = program.institutionCode;
    const entry = map.get(key);
    if (entry) {
      entry.programs.push(program);
    } else {
      map.set(key, { university: program.university, programs: [program] });
    }
  }
  return [...map.entries()]
    .map(([institutionCode, data]) => ({
      institutionCode,
      university: data.university,
      programs: data.programs.sort((a, b) =>
        a.faculty.localeCompare(b.faculty, "ka"),
      ),
    }))
    .sort((a, b) => a.university.localeCompare(b.university, "ka"));
}

function WizardProgress({ step }: { step: WizardStep }) {
  const steps: WizardStep[] = [1, 2, 3];
  return (
    <nav
      className="mb-8 flex items-center justify-center gap-2 sm:gap-4"
      aria-label="კალკულატორის ნაბიჯები"
    >
      {steps.map((n, idx) => {
        const active = step === n;
        const done = step > n;
        return (
          <div key={n} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                  active
                    ? "border-cyan-400/60 bg-cyan-50 text-cyan-700 shadow-md shadow-cyan-100 dark:bg-cyan-500/20 dark:text-cyan-200 dark:shadow-[0_0_16px_rgba(34,211,238,0.35)]"
                    : done
                      ? "border-emerald-400/50 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-500"
                }`}
              >
                {n}
              </span>
              <span
                className={`text-[10px] uppercase tracking-wide sm:text-xs ${
                  active ? "text-cyan-600 dark:text-cyan-300" : "text-slate-500 dark:text-zinc-500"
                }`}
              >
                {STEP_LABELS[n]}
              </span>
            </div>
            {idx < steps.length - 1 ? (
              <div
                className={`h-px w-8 sm:w-14 ${
                  done ? "bg-emerald-400/60 dark:bg-emerald-500/50" : "bg-slate-200 dark:bg-white/10"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export default function ExamCalculatorPage() {
  const [step, setStep] = useState<WizardStep>(1);
  const [scores, setScores] = useState(initialScores);
  const [savedScores, setSavedScores] = useState<Record<string, number> | null>(
    null,
  );
  const [activeFields, setActiveFields] = useState<string[]>([
    "georgian",
    "foreign_language",
    "math",
  ]);
  const [eligiblePrograms, setEligiblePrograms] = useState<CalculatorMatch[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [selectedProgramCode, setSelectedProgramCode] = useState("");
  const [prediction, setPrediction] = useState<CalculatorPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optionalFields = useMemo(
    () => SCORE_FIELDS.filter((f) => !f.required),
    [],
  );

  const payloadScores = useMemo(
    () => buildPayloadScores(scores, activeFields),
    [scores, activeFields],
  );

  const universityGroups = useMemo(
    () => groupByUniversity(eligiblePrograms),
    [eligiblePrograms],
  );

  const selectedGroup = useMemo(
    () =>
      universityGroups.find((g) => g.institutionCode === selectedInstitution) ??
      null,
    [universityGroups, selectedInstitution],
  );

  const selectedProgram = useMemo(
    () => eligiblePrograms.find((p) => p.code === selectedProgramCode) ?? null,
    [eligiblePrograms, selectedProgramCode],
  );

  const toggleField = (id: string) => {
    setActiveFields((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setScores((prev) => ({ ...prev, [id]: prev[id] ?? 0 }));
  };

  const updateScore = (id: string, raw: string) => {
    const max = SCORE_FIELDS.find((f) => f.id === id)?.maxScore ?? 100;
    const num = raw === "" ? 0 : Math.min(max, Math.max(0, Number(raw)));
    setScores((prev) => ({ ...prev, [id]: Number.isNaN(num) ? 0 : num }));
  };

  const fetchEligiblePrograms = useCallback(
    async (scorePayload: Record<string, number>, focusCode?: string) => {
      const res = await fetch("/api/calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: scorePayload, focusCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "შეცდომა მოთხოვნის დროს");
      }
      return {
        results: (data.results ?? []) as CalculatorMatch[],
        prediction: (data.prediction ?? null) as CalculatorPrediction | null,
      };
    },
    [],
  );

  const handleNextToSelection = async () => {
    setError(null);
    if (!payloadScores.georgian && payloadScores.georgian !== 0) {
      setError("მიუთითეთ ქართული ენის ქულა.");
      return;
    }
    if (payloadScores.georgian <= 0) {
      setError("ქართული ენის ქულა უნდა იყოს 0-ზე მეტი.");
      return;
    }

    setLoading(true);
    try {
      const { results } = await fetchEligiblePrograms(payloadScores);
      setSavedScores(payloadScores);
      setEligiblePrograms(results);
      setSelectedInstitution("");
      setSelectedProgramCode("");
      setPrediction(null);
      setStep(2);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "ქსელის შეცდომა. სცადეთ თავიდან.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInstitutionChange = (code: string) => {
    setSelectedInstitution(code);
    setSelectedProgramCode("");
    setPrediction(null);
  };

  const handleFacultyChange = async (programCode: string) => {
    setSelectedProgramCode(programCode);
    if (!savedScores || !programCode) return;

    const cached = eligiblePrograms.find((p) => p.code === programCode);
    if (cached) {
      setPrediction({
        ...cached,
        compatibilityLabel: compatibilityLabel(cached.status),
      });
      setStep(3);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { prediction: nextPrediction } = await fetchEligiblePrograms(
        savedScores,
        programCode,
      );
      if (nextPrediction) {
        setPrediction(nextPrediction);
        setStep(3);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "პროგნოზის ჩატვირთვა ვერ მოხერხდა.",
      );
    } finally {
      setLoading(false);
    }
  };

  const goBackToScores = () => {
    setStep(1);
    setError(null);
    setPrediction(null);
  };

  const goBackToSelection = () => {
    setStep(2);
    setError(null);
    setPrediction(null);
  };

  return (
    <div className="tool-page">
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href={DASHBOARD_ABIT_HREF}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-slate-600 transition-colors hover:text-cyan-600 dark:text-zinc-400 dark:hover:text-cyan-300"
        >
          <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
          დაბრუნება დეშბორდზე
        </Link>

        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/60 bg-gradient-to-br from-cyan-50 to-sky-50 text-cyan-600 shadow-md shadow-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:shadow-[0_0_24px_rgba(34,211,238,0.15)]">
            <Calculator className="h-6 w-6 stroke-[1.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
              გამოცდის კალკულატორი
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              ცნობარი 2026 — ნაბიჯ-ნაბიჯ პროგნოზი
            </p>
          </div>
        </header>

        <WizardProgress step={step} />

        {step === 1 ? (
          <>
            <section className="dashboard-section p-5 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300/90">
                ნაბიჯი 1 — ქულების შეყვანა
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                მონიშნეთ საგნები, რომლებშიც გამოცდა ჩაბარებული გაქვთ.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {SCORE_FIELDS.filter((f) => f.required).map((field) => (
                  <label
                    key={field.id}
                    className="tool-field block border-emerald-300/50 dark:border-emerald-500/25"
                  >
                    <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                      {field.label}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={field.maxScore}
                      value={scores[field.id] || ""}
                      onChange={(e) => updateScore(field.id, e.target.value)}
                      className="tool-input mt-2 ring-cyan-500/40 focus:ring-2"
                    />
                    <span className="mt-1 block text-xs text-slate-500 dark:text-zinc-500">
                      მაქს. {field.maxScore}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {optionalFields.map((field) => {
                  const on = activeFields.includes(field.id);
                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => toggleField(field.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        on
                          ? "tool-chip-active"
                          : "tool-chip hover:border-cyan-300 hover:text-cyan-700 dark:hover:border-white/20"
                      }`}
                    >
                      {field.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {optionalFields
                  .filter((f) => activeFields.includes(f.id))
                  .map((field) => (
                    <label
                      key={field.id}
                      className="tool-field block border-violet-300/50 dark:border-violet-500/20"
                    >
                      <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">
                        {field.label}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={field.maxScore}
                        value={scores[field.id] || ""}
                        onChange={(e) => updateScore(field.id, e.target.value)}
                        className="tool-input mt-2 ring-violet-500/40 focus:ring-2"
                      />
                    </label>
                  ))}
              </div>
            </section>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => void handleNextToSelection()}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-600/80 to-emerald-600/70 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                შემდეგი: უნივერსიტეტების არჩევა
              </button>
              {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <section className="dashboard-section p-5 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300/90">
                ნაბიჯი 2 — უნივერსიტეტი და ფაკულტეტი
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                ნაჩვენებია მხოლოდ პროგრამები, სადაც თქვენი ქულები აკმაყოფილებს
                ცნობარის მინიმალურ ზღვრებს ({eligiblePrograms.length} პროგრამა).
              </p>

              {eligiblePrograms.length === 0 ? (
                <p className="mt-6 rounded-xl border border-amber-300/50 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-200/90">
                  ამ ქულებით შესაბამისი პროგრამა ვერ მოიძებნა. დააბრუნეთ ქულები ან
                  დაამატეთ სხვა არჩევითი საგანი.
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                      უნივერსიტეტი
                    </span>
                    <select
                      value={selectedInstitution}
                      onChange={(e) => handleInstitutionChange(e.target.value)}
                      className="tool-select mt-2 ring-cyan-500/30 focus:ring-2"
                    >
                      <option value="">აირჩიეთ უნივერსიტეტი...</option>
                      {universityGroups.map((group) => (
                        <option key={group.institutionCode} value={group.institutionCode}>
                          {group.university} ({group.programs.length})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                      ფაკულტეტი / პროგრამა
                    </span>
                    <select
                      value={selectedProgramCode}
                      onChange={(e) => void handleFacultyChange(e.target.value)}
                      disabled={!selectedGroup || loading}
                      className="tool-select mt-2 ring-violet-500/30 focus:ring-2 disabled:opacity-50"
                    >
                      <option value="">აირჩიეთ ფაკულტეტი...</option>
                      {selectedGroup?.programs.map((program) => (
                        <option key={program.code} value={program.code}>
                          {program.faculty} — ზღვარი {program.threshold}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </section>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={goBackToScores}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-700 transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-white/20 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                უკან ქულებზე
              </button>
              {loading ? (
                <span className="inline-flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  პროგნოზი იტვირთება...
                </span>
              ) : null}
              {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            </div>
          </>
        ) : null}

        {step === 3 && prediction ? (
          <>
            <section className="rounded-2xl border border-emerald-300/50 bg-gradient-to-b from-emerald-50/80 to-transparent p-1 shadow-lg shadow-emerald-100/30 dark:border-emerald-500/25 dark:from-emerald-500/[0.06] dark:shadow-[0_0_48px_rgba(16,185,129,0.12)]">
              <div className="rounded-[14px] border border-cyan-200/60 bg-white/90 p-4 sm:p-5 dark:border-cyan-500/15 dark:bg-[#070913]/80">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300/90">
                  ნაბიჯი 3 — საბოლოო პროგნოზი
                </h2>
                <ExamPredictionCard prediction={prediction} />
              </div>
            </section>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={goBackToSelection}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-cyan-500/30 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                სხვა პროგრამის არჩევა
              </button>
              <button
                type="button"
                onClick={goBackToScores}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/60 bg-cyan-50 px-5 py-2.5 text-sm text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/15"
              >
                ქულების შეცვლა
              </button>
            </div>
          </>
        ) : null}

        {step === 3 && !prediction && selectedProgram ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-zinc-400">პროგნოზი მზადდება...</p>
        ) : null}
      </main>
    </div>
  );
}
