"use client";

import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";

/** While the cards are written: how many are ready, counted from the stream. */
export function GenerationProgress({
  total,
  ready,
  sourceLabel,
  error,
  onRetry,
  onBack,
}: {
  total: number;
  ready: number;
  sourceLabel?: string;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  const percent = Math.min(95, Math.round((ready / Math.max(1, total)) * 100));
  return (
    <div className="gen under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-[calc(var(--safe-top)+24px)] sm:px-6 md:pt-14">
        <section className="gen-card p-6 sm:p-8" aria-live="polite">
          <h1 className="text-[24px] font-bold text-[var(--gen-title)]">ბარათებს ვქმნით</h1>
          <p className="mt-1 text-[14.5px] text-[var(--gen-muted)]">
            {[sourceLabel, `${total} ბარათი`].filter(Boolean).join(" · ")}
          </p>
          {error ? (
            <Alert
              tone="error"
              className="mt-6"
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
              <div className="mt-6 flex items-center gap-2 text-[15px] font-semibold text-[var(--gen-title)]">
                <Loader2 className="h-4 w-4 animate-spin text-[#e11d74]" aria-hidden />
                {ready} / {total} ბარათი მზადაა
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--gen-soft)]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-[#e11d74] transition-[width] duration-500" style={{ width: `${Math.max(4, percent)}%` }} />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
