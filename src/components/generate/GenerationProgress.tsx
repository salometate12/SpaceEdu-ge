"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Check, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { generationPercent, generationStep } from "@/lib/generation-progress";

const TIPS = [
  "ბარათი უკეთ გამახსოვრდება, თუ პასუხს ჯერ თავად გაიხსენებ და მერე გადააბრუნებ.",
  "„არ ვიცი“ არ არის წარუმატებლობა: ეს ბარათები მეორე რაუნდში დაგიბრუნდება.",
  "მოკლე და ხშირი გამეორება უკეთ მუშაობს, ვიდრე ერთი გრძელი.",
  "ხვალ ისევ გაიარე ის ბარათები, რომლებიც დღეს ვერ გაიხსენე.",
  "პასუხი ხმამაღლა თქვი: ასე უფრო მალე გამახსოვრდება.",
  "ბარათები აურიე, რომ თანმიმდევრობა არ დაიმახსოვრო.",
  "ბოლოს დასტა ქვიზად აქციე და შეამოწმე, რამდენი დაგამახსოვრდა.",
];

const CARD_STEPS = ["ვკითხულობთ მასალას", "ვარჩევთ მთავარ ცნებებს", "ვწერთ ბარათებს", "ვამოწმებთ პასუხებს"];
const SUMMARY_STEPS = ["ვკითხულობთ მასალას", "ვარჩევთ მთავარ თემებს", "ვწერთ კონსპექტს", "ვამოწმებთ სტრუქტურას"];
const TILTS = [-6, 3, -2, 4, -4];
const TIP_MS = 6000;

/** Seconds since the screen opened, ticking once a second. */
function useElapsed(): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return elapsed;
}

function Placeholder() {
  return (
    <span className="flex flex-col gap-2" aria-hidden>
      <span className="h-2.5 w-3/4 rounded-full bg-[#fbcfe8] dark:bg-[rgba(236,72,153,0.35)]" />
      <span className="h-2.5 w-full rounded-full bg-[var(--gen-soft)]" />
      <span className="h-2.5 w-2/3 rounded-full bg-[var(--gen-soft)]" />
    </span>
  );
}

/**
 * While the cards are written: the cards dealt onto a deck on the left, the
 * steps, a bar and a tip on the right. The counter is real (cards parsed
 * from the stream); the bar stops at 95% until the answer is in. The
 * summary gets the same screen with sheets instead of cards.
 */
export function GenerationProgress({
  kind = "flashcards",
  total,
  ready,
  latestQuestion,
  sourceLabel,
  error,
  onRetry,
  onBack,
  keepsGoing = false,
}: {
  kind?: "flashcards" | "summary";
  total: number;
  ready: number;
  latestQuestion?: string | null;
  sourceLabel?: string;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  /** Saved and finished without this page: says it can be closed. */
  keepsGoing?: boolean;
}) {
  const elapsed = useElapsed();
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTip((value) => (value + 1) % TIPS.length), TIP_MS);
    return () => window.clearInterval(timer);
  }, []);

  const cards = kind === "flashcards";
  const steps = cards ? CARD_STEPS : SUMMARY_STEPS;
  const step = generationStep({ ready, total: cards ? total : 0, elapsed });
  const percent = generationPercent({ ready, total: cards ? total : 0, elapsed });
  const subtitle = [sourceLabel, cards ? `${total} ბარათი` : "კონსპექტი"].filter(Boolean).join(" · ");

  return (
    <div className="gen under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1080px] px-4 pb-16 pt-[calc(var(--safe-top)+20px)] sm:px-6 md:pt-12">
        <section className="gen-card grid overflow-hidden !rounded-[28px] md:grid-cols-[1.1fr_1fr]">
          <div className="deal-stage relative h-[300px] overflow-hidden md:h-auto md:min-h-[460px]" aria-hidden>
            <div className="absolute inset-0 origin-center md:scale-[1.45]">
              {TILTS.map((tilt, index) => (
                <span key={tilt} className={`deal-card ${cards ? "" : "deal-sheet"}`} style={{ "--tilt": `${tilt}deg`, zIndex: index } as CSSProperties} />
              ))}
              <span
                key={cards ? ready : "sheet"}
                className={`deal-card deal-fly flex flex-col gap-3 p-4 ${cards ? "" : "deal-sheet"}`}
                style={{ "--tilt": "2deg", zIndex: 10 } as CSSProperties}
              >
                {cards ? (
                  <>
                    <span className="text-[11px] font-bold text-[#db2777]">კითხვა {Math.min(total, ready + 1)}</span>
                    {latestQuestion ? (
                      <span className="line-clamp-3 text-[12.5px] font-semibold leading-snug text-[var(--gen-title)]">{latestQuestion}</span>
                    ) : (
                      <Placeholder />
                    )}
                  </>
                ) : (
                  <>
                    <span className="h-2.5 w-1/2 rounded-full bg-[#fbcfe8] dark:bg-[rgba(236,72,153,0.35)]" />
                    {[0, 1, 2, 3, 4, 5].map((line) => (
                      <span key={line} className="h-2 rounded-full bg-[var(--gen-soft)]" style={{ width: `${92 - (line % 3) * 14}%` }} />
                    ))}
                  </>
                )}
              </span>
            </div>
            {cards ? (
              <span className="deal-pulse absolute right-4 top-4 z-20 rounded-full bg-[var(--gen-card)] px-3 py-1.5 text-[13px] font-bold tabular-nums text-[var(--gen-title)]">
                {ready} / {total} ბარათი
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-6 p-6 sm:p-8" aria-live="polite">
            <div>
              <h1 className="text-[24px] font-bold leading-tight text-[var(--gen-title)] sm:text-[28px]">
                {cards ? (
                  <>
                    ბარათებს ვარიგებთ <span className="gen-mark">შენს დასტაში</span>
                  </>
                ) : (
                  <>
                    კონსპექტს <span className="gen-mark">ვწერთ</span>
                  </>
                )}
              </h1>
              <p className="mt-1.5 text-[14.5px] text-[var(--gen-muted)]">{subtitle}</p>
            </div>

            {error ? (
              <Alert
                tone="error"
                action={
                  <>
                    <button type="button" onClick={onRetry} className="gen-primary h-10 px-5 text-[14px]">
                      თავიდან ცდა
                    </button>
                    <button type="button" onClick={onBack} className="gen-secondary h-10 px-5 text-[14px]">
                      მასალის შეცვლა
                    </button>
                  </>
                }
              >
                {error}
              </Alert>
            ) : (
              <>
                <ol className="flex flex-col gap-3">
                  {steps.map((label, index) => {
                    const done = index < step;
                    const current = index === step;
                    return (
                      <li key={label} className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                            done
                              ? "bg-[#dcfce7] text-[#16a34a] dark:bg-[rgba(74,222,128,0.14)] dark:text-[#86efac]"
                              : current
                                ? "text-[#e11d74]"
                                : "border-[1.5px] border-[var(--gen-field-border)]"
                          }`}
                          aria-hidden
                        >
                          {done ? <Check className="h-4 w-4" strokeWidth={3} /> : current ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                        </span>
                        <span className={`text-[15px] ${current ? "font-bold text-[var(--gen-title)]" : done ? "text-[var(--gen-text)]" : "text-[var(--gen-faint)]"}`}>
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--gen-soft)]" role="progressbar" aria-label="პროგრესი" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-[#e11d74] transition-[width] duration-700" style={{ width: `${Math.max(3, percent)}%` }} />
                </div>
                {keepsGoing ? (
                  <p className="-mt-3 text-[13.5px] text-[var(--gen-muted)]">შეგიძლია დახურო, მზად რომ იქნება შეგატყობინებთ</p>
                ) : null}

                <div className="mt-auto rounded-[18px] bg-[#fefce8] p-4 dark:bg-[rgba(250,204,21,0.1)]">
                  <p className="text-[12.5px] font-bold text-[#854d0e] dark:text-[#fde68a]">რჩევა</p>
                  <p key={tip} className="deal-tip mt-1 min-h-[3em] text-[14.5px] leading-snug text-[var(--gen-title)]">
                    {TIPS[tip]}
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
