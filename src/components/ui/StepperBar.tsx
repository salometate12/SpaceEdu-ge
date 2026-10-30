"use client";

import { Fragment } from "react";
import { Check } from "lucide-react";

export interface StepperStep {
  label: string;
}

/**
 * The steps of a form, for /cv and /presentation. Desktop: one white pill,
 * a circle and a name per step on one line, joined by lines that turn
 * green behind you. A finished step can be clicked to go back to it; the
 * ones ahead can't. Below 768px: a card with the step's name, „ნაბიჯი n / N“, a
 * segmented bar and what comes next. `current` is 1-based.
 */
export function StepperBar({
  steps,
  current,
  onStep,
  className = "",
}: {
  steps: StepperStep[];
  current: number;
  /** Called with a finished step's number (1-based). */
  onStep?: (step: number) => void;
  className?: string;
}) {
  const next = steps[current];
  return (
    <nav aria-label="ნაბიჯები" className={className}>
      <ol className="flex items-center gap-3.5 rounded-full border border-[var(--wz-border)] bg-[var(--wz-card)] py-2.5 pl-2.5 pr-5 max-md:hidden">
        {steps.map((step, index) => {
          const number = index + 1;
          const done = number < current;
          const active = number === current;
          const content = (
            <>
              <span
                className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${
                  active
                    ? "bg-[var(--wz-strong)] text-[var(--wz-on-strong)]"
                    : done
                      ? "bg-[var(--wz-done-bg)] text-[var(--wz-done)]"
                      : "border-[1.5px] border-[var(--wz-field-border)] text-[var(--wz-future)]"
                }`}
                aria-hidden
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : number}
              </span>
              <span
                className={`whitespace-nowrap text-[14.5px] ${active ? "" : "max-lg:sr-only"} ${
                  active ? "font-bold text-[var(--wz-title)]" : done ? "font-medium text-[var(--wz-text)]" : "font-medium text-[var(--wz-future)]"
                }`}
              >
                {step.label}
              </span>
            </>
          );
          return (
            <Fragment key={step.label}>
              <li className="flex shrink-0 items-center" aria-current={active ? "step" : undefined}>
                {done && onStep ? (
                  <button type="button" onClick={() => onStep(number)} className="wz-focus flex items-center gap-2.5 rounded-full pr-1 transition-opacity hover:opacity-80">
                    {content}
                    <span className="sr-only">, დასრულებულია. გადასვლა</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-2.5">{content}</span>
                )}
              </li>
              {index < steps.length - 1 ? (
                <li aria-hidden className={`h-0.5 min-w-4 flex-1 rounded-full ${done ? "bg-[var(--wz-done-line)]" : "bg-[var(--wz-border)]"}`} />
              ) : null}
            </Fragment>
          );
        })}
      </ol>

      <div className="rounded-[20px] border border-[var(--wz-border)] bg-[var(--wz-card)] p-4 md:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-[15px] font-bold text-[var(--wz-title)]" aria-current="step">
            {steps[current - 1]?.label}
          </span>
          <span className="shrink-0 text-[13px] text-[var(--wz-faint)]">
            ნაბიჯი {current} / {steps.length}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {steps.map((step, index) => (
            <span
              key={step.label}
              className={`h-1.5 flex-1 rounded-full ${
                index + 1 < current ? "bg-[var(--wz-segment-done)]" : index + 1 === current ? "bg-[var(--wz-strong)]" : "bg-[var(--wz-border)]"
              }`}
            />
          ))}
        </div>
        {next ? <p className="mt-2.5 text-[12.5px] text-[var(--wz-faint)]">შემდეგი: {next.label}</p> : null}
      </div>
    </nav>
  );
}
