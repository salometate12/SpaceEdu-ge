"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  LoaderCircle,
  PenLine,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { ESSAY_TOTAL_MAX } from "@/lib/ai/essay-grader-schema";
import { getSubjectHub } from "@/lib/abiturient-subject-hub";
import { EssayReport } from "./EssayReport";
import { useEssayGrading } from "./useEssayGrading";

const SAMPLE_PROMPTS = [
  "რა როლს თამაშობს ტრადიცია თანამედროვე საზოგადოებაში?",
  "შეიძლება თუ არა ტექნოლოგიამ ჩაანაცვლოს მასწავლებელი?",
  "რას ნიშნავს პასუხისმგებლობა ახალგაზრდისთვის?",
];


export function EssayGrader({ subjectId }: { subjectId: string }) {
  const subject = getSubjectHub(subjectId);
  const [prompt, setPrompt] = useState("");
  const [essay, setEssay] = useState("");
  const { result, busy, usedFallback, grade } = useEssayGrading();

  const wordCount = useMemo(
    () => essay.trim().split(/\s+/).filter(Boolean).length,
    [essay],
  );

  // The archive hands the exam's own essay task over via ?prompt=, so the
  // student lands here with the real task already filled in.
  useEffect(() => {
    const prefill = () => {
      const fromUrl = new URLSearchParams(window.location.search).get("prompt");
      if (fromUrl) setPrompt(fromUrl);
    };
    prefill();
  }, []);


  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href={subjectId === "georgian" ? "/subject/georgian" : `/subject/${subjectId}`}
        className="mb-6 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-violet-400/50 hover:text-slate-900 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:text-white"
        aria-label="დაბრუნება"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>

      <header className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-[#0D0D15]/80">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300">
          <ScrollText className="h-3 w-3 stroke-[2]" />
          {subject?.title ?? "ქართული ენა"}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">ესეს შემფასებელი</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          დაწერე ან ჩასვი ესე — შეფასდება ეროვნული გამოცდების რუბრიკით: შინაარსი,
          არგუმენტაცია, სტრუქტურა და გრამატიკა, თითო 5 ქულა, სულ {ESSAY_TOTAL_MAX}.
        </p>
      </header>

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        {/* ---------------------------- editor ---------------------------- */}
        <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-[#0D0D15]/80">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              ესეს თემა (არასავალდებულო)
            </span>
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="მაგ: რა როლს თამაშობს ტრადიცია თანამედროვე საზოგადოებაში?"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-zinc-600"
            />
          </label>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setPrompt(sample)}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:border-violet-400/40 hover:text-violet-700 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-zinc-400 dark:hover:text-violet-200"
              >
                {sample}
              </button>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
              <span>ესეს ტექსტი</span>
              <span className={wordCount >= 250 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-zinc-600"}>
                {wordCount} სიტყვა
              </span>
            </span>
            <textarea
              value={essay}
              onChange={(event) => setEssay(event.target.value)}
              placeholder="დაიწყე წერა აქ... საგამოცდო ესესთვის სასურველია 250-400 სიტყვა, სამი ნაწილით: შესავალი, არგუმენტები, დასკვნა."
              className="min-h-[400px] w-full resize-y rounded-xl border border-slate-200 bg-white p-4 font-sans text-[15px] leading-[1.9] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400/50 dark:border-white/10 dark:bg-[#08080d]/80 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
          </label>

          <button
            type="button"
            onClick={() => void grade(essay, prompt)}
            disabled={busy || wordCount === 0}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:bg-violet-500 dark:hover:bg-violet-400 dark:disabled:bg-white/10 dark:disabled:text-white/40"
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
          {result ? (
            <EssayReport result={result} usedFallback={usedFallback} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 text-center backdrop-blur-xl dark:border-white/10 dark:bg-[#0D0D15]/60">
              <PenLine
                className="mx-auto h-9 w-9 text-slate-300 dark:text-zinc-600"
                strokeWidth={1.5}
              />
              <p className="mt-3 text-sm text-slate-600 dark:text-zinc-400">
                შეფასების ანგარიში აქ გამოჩნდება.
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-zinc-600">
                ქულა, კრიტერიუმების ჩაშლა და კონკრეტული შესწორებები.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
