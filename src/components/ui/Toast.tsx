"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";

/**
 * A short message at the bottom of the screen (above the phone's dock),
 * with an optional action such as „დაბრუნება“. It closes by itself.
 */
export function Toast({
  message,
  actionLabel,
  onAction,
  onClose,
  duration = 5000,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [onClose, duration, message]);

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+104px)] z-[80] mx-auto flex max-w-sm items-center justify-between gap-3 rounded-full bg-[#18181b] py-2 pl-4 pr-2 text-[14px] font-medium text-white shadow-[0_12px_32px_-12px_rgb(0_0_0/0.45)] md:bottom-8 dark:bg-[#f4f4f5] dark:text-[#18181b]"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Check className="h-4 w-4 shrink-0 text-emerald-400 dark:text-emerald-600" strokeWidth={2.6} aria-hidden />
        <span className="truncate">{message}</span>
      </span>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-full px-3 py-1.5 font-semibold text-pink-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/60 dark:text-pink-600 dark:hover:bg-black/5"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
