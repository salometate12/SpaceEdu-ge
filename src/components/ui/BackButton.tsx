"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Whether going back stays on this site: the page was opened from one of ours. */
export function cameFromThisSite(): boolean {
  if (typeof window === "undefined" || window.history.length <= 1 || !document.referrer) return false;
  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * The round back button (48px; 40px on a phone, 44px with `size="lg"`):
 * back in history when that stays on SpaceEdu, otherwise to `fallbackHref`
 * (usually the dashboard). `onClick` replaces that, for a page that steps
 * back inside itself (the quiz leaving a run).
 */
export function BackButton({
  fallbackHref = "/dashboard-student",
  label = "უკან",
  size = "md",
  onClick,
  className = "",
}: {
  fallbackHref?: string;
  label?: string;
  size?: "md" | "lg";
  onClick?: () => void;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick ?? (() => (cameFromThisSite() ? router.back() : router.push(fallbackHref)))}
      className={`flex ${size === "lg" ? "h-11 w-11" : "h-10 w-10"} shrink-0 items-center justify-center rounded-full border border-[#e7e5e4] bg-white text-[#1c1a17] transition-colors hover:bg-[#f5f4f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e11d74] focus-visible:ring-offset-2 sm:h-12 sm:w-12 dark:border-[#2e2e38] dark:bg-[#15151b] dark:text-[#fafaf9] dark:hover:bg-[#1f1f27] ${className}`}
    >
      <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
    </button>
  );
}
