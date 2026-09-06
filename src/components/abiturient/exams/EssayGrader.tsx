"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CircleAlert,
  LoaderCircle,
  PenLine,
  ScrollText,
  Sparkles,
  ThumbsUp,
  Wrench,
} from "lucide-react";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import {
  ESSAY_CRITERION_HINTS,
  ESSAY_CRITERION_LABELS,
  ESSAY_CRITERION_MAX,
  ESSAY_TOTAL_MAX,
  type EssayCriterionId,
  type EssayGraderResponse,
} from "@/lib/ai/essay-grader-schema";
import { localGradeEssay } from "@/lib/essay-grader-local";
import { getSubjectHub } from "@/lib/abiturient-subject-hub";
import { recordQuestProgress } from "@/lib/daily-quests";
import { recordToolUsage } from "@/lib/activity";

const SAMPLE_PROMPTS = [
  "რა როლს თამაშობს ტრადიცია თანამედროვე საზოგადოებაში?",
  "შეიძლება თუ არა ტექნოლოგიამ ჩაანაცვლოს მასწავლებელი?",
  "რას ნიშნავს პასუხისმგებლობა ახალგაზრდისთვის?",
];

function scoreTone(score: number, max: number): string {
  const ratio = score / max;
  if (ratio >= 0.8) return "#34d399";
  if (ratio >= 0.55) return "#fbbf24";
  return "#fb7185";
}

export function EssayGrader({ subjectId }: { subjectId: string }) {
  const subject = getSubjectHub(subjectId);
  const [prompt, setPrompt] = useState("");
  const [essay, setEssay] = useState("");
  const [result, setResult] = useState<EssayGraderResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const wordCount = useMemo(
    () => essay.trim().split(/\s+/).filter(Boolean).length,
    [essay],
  );

  const grade = useCallback(async () => {
    const text = essay.trim();
    if (!text || busy) return;
    setBusy(true);
    setResult(null);
    setUsedFallback(false);
    recordToolUsage("abit-essay-grader", "ესეს შემფასებელი");

    try {
      const response = await fetchAiJson<EssayGraderResponse>({
        pageType: "essay-grader",
        responseMode: "json",
        payload: { essay: text, prompt: prompt.trim() || undefined },
      });
      setResult(response);
    } catch (error) {
      // The editor must never leave the student empty-handed — fall back
      // to the local rubric heuristics.
      console.warn("essay grader falling back to local rubric", error);
      setResult(localGradeEssay(text, prompt.trim() || undefined));
      setUsedFallback(true);
    } finally {
      setBusy(false);
      recordQuestProgress("write-essay", 1);
    }
  }, [essay, prompt, busy]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href={subjectId === "georgian" ? "/subject/georgian" : `/subject/${subjectId}`}
        className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-zinc-300 transition hover:border-violet-400/30 hover:text-white"
        aria-label="დაბრუნება"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <header className="rounded-2xl border border-white/10 bg-[#0D0D15]/80 p-6 backdrop-blur-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
          <ScrollText className="h-3 w-3 stroke-[2]" />
          {subject?.title ?? "ქართული ენა"}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">ესეს შემფასებელი</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          დაწერე ან ჩასვი ესე — შეფასდება ეროვნული გამოცდების რუბრიკით: შინაარსი,
          არგუმენტაცია, სტრუქტურა და გრამატიკა, თითო 5 ქულა, სულ {ESSAY_TOTAL_MAX}.
        </p>
      </header>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        {/* ---------------------------- editor ---------------------------- */}
        <section className="rounded-2xl border border-white/10 bg-[#0D0D15]/80 p-6 backdrop-blur-xl">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              ესეს თემა (არასავალდებულო)
            </span>
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="მაგ: რა როლს თამაშობს ტრადიცია თანამედროვე საზოგადოებაში?"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/50"
            />
          </label>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setPrompt(sample)}
                className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[10px] font-medium text-zinc-400 transition hover:border-violet-400/30 hover:text-violet-200"
              >
                {sample}
              </button>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <span>ესეს ტექსტი</span>
              <span className={wordCount >= 250 ? "text-emerald-400" : "text-zinc-600"}>
                {wordCount} სიტყვა
              </span>
            </span>
            <textarea
              value={essay}
              onChange={(event) => setEssay(event.target.value)}
              placeholder="დაიწყე წერა აქ... საგამოცდო ესესთვის სასურველია 250-400 სიტყვა, სამი ნაწილით: შესავალი, არგუმენტები, დასკვნა."
              className="min-h-[400px] w-full resize-y rounded-xl border border-white/10 bg-[#08080d]/80 p-4 font-sans text-[15px] leading-[1.9] text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-violet-400/50"
            />
          </label>

          <button
            type="button"
            onClick={() => void grade()}
            disabled={busy || wordCount === 0}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
          >
            {busy ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                მიმდინარეობს შეფასება...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 stroke-[2]" />
                შეაფასე ესე
              </>
            )}
          </button>
        </section>

        {/* ---------------------------- report ---------------------------- */}
        <section className="lg:sticky lg:top-24">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-white/10 bg-[#0D0D15]/60 p-8 text-center backdrop-blur-xl"
              >
                <PenLine className="mx-auto h-9 w-9 text-zinc-600" strokeWidth={1.5} />
                <p className="mt-3 text-sm text-zinc-400">
                  შეფასების ანგარიში აქ გამოჩნდება.
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  ქულა, კრიტერიუმების ჩაშლა და კონკრეტული შესწორებები.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* total */}
                <div className="rounded-2xl border border-white/10 bg-[#0D0D15]/80 p-6 text-center backdrop-blur-xl">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    საბოლოო ქულა
                  </p>
                  <p className="mt-2 text-5xl font-black text-white">
                    {result.totalScore}
                    <span className="text-2xl font-bold text-zinc-500">
                      /{ESSAY_TOTAL_MAX}
                    </span>
                  </p>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: scoreTone(result.totalScore, ESSAY_TOTAL_MAX),
                      }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(result.totalScore / ESSAY_TOTAL_MAX) * 100}%`,
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <p className="mt-4 text-left text-[13px] leading-relaxed text-zinc-400">
                    {result.summary}
                  </p>
                  {usedFallback && (
                    <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-left text-[11px] leading-relaxed text-amber-200/80">
                      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-[1.75]" />
                      AI მიუწვდომელია — ნაჩვენებია ლოკალური რუბრიკული შეფასება.
                    </p>
                  )}
                </div>

                {/* criteria breakdown */}
                <div className="rounded-2xl border border-white/10 bg-[#0D0D15]/80 p-5 backdrop-blur-xl">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    კრიტერიუმები
                  </p>
                  <div className="space-y-4">
                    {result.criteria.map((criterion) => {
                      const id = criterion.id as EssayCriterionId;
                      const tone = scoreTone(criterion.score, ESSAY_CRITERION_MAX);
                      return (
                        <div key={id}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-semibold text-white">
                              {ESSAY_CRITERION_LABELS[id]}
                            </span>
                            <span className="text-sm font-bold" style={{ color: tone }}>
                              {criterion.score}/{ESSAY_CRITERION_MAX}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-zinc-600">
                            {ESSAY_CRITERION_HINTS[id]}
                          </p>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: tone }}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(criterion.score / ESSAY_CRITERION_MAX) * 100}%`,
                              }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                          <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-400">
                            {criterion.comment}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* strengths */}
                {result.strengths.length > 0 && (
                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-5">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      <ThumbsUp className="h-3 w-3 stroke-[2]" />
                      ძლიერი მხარეები
                    </p>
                    <ul className="space-y-1.5">
                      {result.strengths.map((strength) => (
                        <li
                          key={strength}
                          className="flex gap-2 text-[13px] leading-relaxed text-emerald-50/85"
                        >
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* corrections */}
                {result.corrections.length > 0 && (
                  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-5">
                    <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      <Wrench className="h-3 w-3 stroke-[2]" />
                      რა გავასწოროთ
                    </p>
                    <ul className="space-y-3">
                      {result.corrections.map((correction) => (
                        <li key={correction.issue}>
                          <p className="text-[13px] font-semibold leading-relaxed text-cyan-100">
                            {correction.issue}
                          </p>
                          <p className="mt-0.5 text-[12.5px] leading-relaxed text-cyan-50/70">
                            → {correction.fix}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
