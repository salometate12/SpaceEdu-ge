"use client";

import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";

/**
 * A step's buttons: „← უკან“ (not on the first step) and „ნაბიჯი n / N“ on
 * the left, the main button on the right: „შემდეგი →“, or the generate
 * button with a sparkle on the last step. On a phone it sticks to the
 * bottom above the dock, the back button shrinks to an arrow and the main
 * one takes the rest of the row.
 */
export function StepFooter({
  step,
  total,
  onBack,
  onNext,
  nextLabel = "შემდეგი",
  final = false,
  disabled = false,
  busy = false,
}: {
  step: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  /** The last step before generating: sparkle instead of the arrow. */
  final?: boolean;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center gap-3 border-t border-[var(--wz-divider)] pt-5 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:mt-0 max-md:border-[var(--wz-border)] max-md:bg-[var(--wz-bg)] max-md:px-4 max-md:pb-[calc(env(safe-area-inset-bottom)+96px)] max-md:pt-3">
      {step > 1 ? (
        <button type="button" onClick={onBack} disabled={busy} aria-label="უკან" className="wz-secondary h-[52px] w-[52px] shrink-0 text-[15px] md:w-auto md:px-6">
          <ArrowLeft className="h-5 w-5" aria-hidden />
          <span className="max-md:hidden">უკან</span>
        </button>
      ) : null}
      <span className="text-[13.5px] text-[var(--wz-faint)] max-md:hidden">
        ნაბიჯი {step} / {total}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={disabled || busy}
        className="wz-primary h-[52px] px-7 text-[15.5px] max-md:flex-1 md:ml-auto"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : final ? <Sparkles className="h-5 w-5" aria-hidden /> : null}
        {nextLabel}
        {!final && !busy ? <ArrowRight className="h-5 w-5" aria-hidden /> : null}
      </button>
    </div>
  );
}
