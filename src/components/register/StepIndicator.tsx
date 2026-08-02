"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
  step: 1 | 2 | 3;
}

export function StepIndicator({ step }: StepIndicatorProps) {
  return (
    <div className="mb-4 flex items-center justify-center gap-2">
      {[1, 2, 3].map((n) => {
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                done
                  ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                  : active
                    ? "border-[#7C3AED] text-[#a78bfa]"
                    : "border-[var(--border-hover)] text-[var(--text-muted)]"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </div>
            {n < 3 && (
              <div
                className={`mx-1 h-[1px] w-10 ${
                  n < step ? "bg-[#7C3AED]" : "bg-[var(--border-hover)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

