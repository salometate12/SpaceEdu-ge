"use client";

import Link from "next/link";
import { useState } from "react";
import { AiSkeletonLoader } from "@/components/ui/AiSkeletonLoader";
import { fetchAiJson } from "@/lib/ai/fetch-ai";
import type { Eli5Response } from "@/lib/ai/eli5-schema";

type SimplicityLevel = "kid" | "school" | "freshman";

const LEVELS: Array<{ id: SimplicityLevel; label: string }> = [
  { id: "kid", label: "5 წლის ბავშვი" },
  { id: "school", label: "სკოლის მოსწავლე" },
  { id: "freshman", label: "პირველკურსელი" },
];

export function Eli5Explainer() {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<SimplicityLevel>("kid");
  const [result, setResult] = useState<Eli5Response | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explain = async () => {
    const term = query.trim();
    if (!term) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchAiJson<Eli5Response>({
        pageType: "eli5",
        responseMode: "json",
        payload: { query: term, level },
      });
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex items-start gap-3">
        <Link
          href="/dashboard-student"
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.03] text-zinc-300 transition hover:border-purple-400/30 hover:bg-purple-500/10 hover:text-white"
          aria-label="Dashboard"
        >
          ←
        </Link>
        <div>
          <h1 className="headline text-2xl font-bold text-zinc-100 sm:text-3xl">
            ELI5 გახსნა
          </h1>
          <p className="mt-1 max-w-4xl text-sm text-zinc-400">
            ჩაწერე ნებისმიერი რთული ტერმინი, თეორია ან ფორმულა და AI მას უმარტივეს
            ენაზე აგიხსნის.
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-2xl border border-white/[0.08] bg-[#121214]/60 p-5 backdrop-blur-md">
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="მაგ: რელიატიურობის თეორია, ან კოდში რეაქტის useEffect ჰუკი..."
            className="h-32 w-full rounded-2xl border border-white/[0.08] bg-[#121214]/60 p-5 text-white outline-none transition-all placeholder:text-zinc-500 focus:border-purple-500/50"
          />

          <div className="mt-4">
            <p className="mb-2 text-sm text-zinc-400">სიმარტივის დონე</p>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((item) => {
                const active = level === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLevel(item.id)}
                    className={`rounded-full px-3 py-1.5 text-xs transition ${
                      active
                        ? "border border-purple-500/45 bg-purple-500/10 text-purple-300 shadow-[0_0_0_1px_rgba(168,85,247,0.35)]"
                        : "border border-white/[0.06] bg-[#161619] text-gray-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={explain}
              disabled={isLoading}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/10 transition-all hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? "იტვირთება..." : "მარტივად ახსნა"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="relative mt-6 min-h-[150px] rounded-2xl border border-white/[0.05] bg-white/[0.01] p-6">
          {isLoading ? (
            <AiSkeletonLoader rows={2} />
          ) : result ? (
            <div className="space-y-4 text-sm leading-7 text-zinc-200">
              <h2 className="text-base font-semibold text-purple-200">{result.title}</h2>
              <p className="whitespace-pre-wrap">{result.explanation}</p>
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.04] p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-purple-300/80">
                  მეტაფორა
                </p>
                <p className="whitespace-pre-wrap text-zinc-300">{result.analogy}</p>
              </div>
              <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-zinc-300">
                <span className="font-medium text-zinc-100">დაიმახსოვრე: </span>
                {result.rememberThis}
              </p>
              {result.followUpQuestion && (
                <p className="text-xs text-zinc-500">
                  შემოწმება: {result.followUpQuestion}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">ახსნა გამოჩნდება აქ...</p>
          )}
        </div>
      </div>
    </section>
  );
}
