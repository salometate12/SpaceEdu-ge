"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The shared shell for the site header: a dark, floating pill that sits on
 * top of the page in both themes. `LandingHeader` and `DashboardHeader`
 * fill it with their own middle and right-hand content, so the two look
 * like one header with different controls.
 *
 * The `dark` class is deliberate — see `.header-pill` in globals.css. The
 * bar is dark whatever the page theme is, so its children (theme toggle,
 * space chip, avatar menu…) must render their night-mode styling.
 */
export function HeaderPill({
  scrolled,
  children,
}: {
  scrolled: boolean;
  children: ReactNode;
}) {
  // The strip around the pill stays transparent — a tinted band would read
  // as a light bar across the dark landing hero. Depth on scroll comes from
  // the pill's own shadow instead.
  return (
    <header className="px-3 py-2.5 sm:px-6 sm:py-3">
      <div
        className={`header-pill dark mx-auto flex h-[52px] w-full max-w-7xl items-center gap-1.5 rounded-full border border-white/[0.08] px-2 transition-shadow duration-300 sm:h-14 sm:gap-2 sm:px-2.5 xl:gap-3 ${
          scrolled
            ? "shadow-[0_18px_44px_-20px_rgba(2,6,23,0.7)]"
            : "shadow-[0_12px_32px_-20px_rgba(2,6,23,0.55)]"
        }`}
      >
        {children}
      </div>
    </header>
  );
}

/** Logo badge + wordmark, always the left-most item in the pill. */
export function HeaderBrand({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group flex shrink-0 items-center gap-2 rounded-full transition-opacity hover:opacity-90 sm:gap-2.5 sm:pr-2"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-[0_0_18px_rgba(124,58,237,0.45)] sm:h-9 sm:w-9">
        <Rocket className="h-4 w-4 text-white" strokeWidth={2.2} />
      </span>
      <span className="headline text-sm font-bold tracking-tight text-white sm:text-[15px]">
        SpaceEdu
      </span>
    </Link>
  );
}

/** Centred link row. Collapses on narrow desktops so the pill never wraps. */
export function HeaderNav({ children }: { children: ReactNode }) {
  return (
    <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex">
      {children}
    </nav>
  );
}

/**
 * Shared look for everything that lives in `HeaderNav`. Below `xl` the
 * label shrinks a step and the padding tightens: six Georgian labels plus
 * the wordmark and the call to action don't fit a 1024-wide bar at full
 * size, and `whitespace-nowrap` means a squeezed row clips rather than
 * wraps.
 */
export function headerNavItemClass(active = false) {
  return `shrink-0 whitespace-nowrap rounded-full px-2 py-2 text-[13px] transition-colors xl:px-3.5 xl:text-sm ${
    active
      ? "bg-white/[0.12] font-semibold text-white"
      : "text-white/70 hover:bg-white/[0.07] hover:text-white"
  }`;
}

/** The white pill on the right — one primary action per header. */
export function HeaderCta({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3.5 text-[13px] font-bold text-[#0f0f14] transition-all hover:bg-white/90 active:scale-[0.98] sm:h-10 sm:px-5 sm:text-sm"
    >
      {children}
    </Link>
  );
}
