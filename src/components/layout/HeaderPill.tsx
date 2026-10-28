"use client";

import Link from "next/link";
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
  tone = "dark",
  children,
}: {
  scrolled: boolean;
  /** "page": the landing's pill, white or dark with the theme (landing.css). */
  tone?: "dark" | "page";
  children: ReactNode;
}) {
  if (tone === "page") {
    return (
      <header className="px-3 py-2.5 sm:px-6 sm:py-3">
        <div
          className={`landing-pill mx-auto flex h-14 w-full max-w-[1180px] items-center gap-1.5 rounded-full px-2 transition-shadow duration-300 sm:h-16 sm:gap-2 sm:px-3 ${
            scrolled ? "shadow-[0_12px_32px_-20px_rgba(28,26,23,0.35)]" : ""
          }`}
        >
          {children}
        </div>
      </header>
    );
  }
  // The strip carries no colour of its own — `Header` paints it in the
  // ground of the page it floats over, so the pill reads as sitting on
  // that page rather than on a band of its own. Depth on scroll comes
  // from the pill's shadow.
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

/** The full logo (books + "SpaceEdu") in its -dark artwork, for dark
 * surfaces — the header pill and the mobile menu. One place to change it. */
export function BrandLogo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG
    <img src="/spaceedu-logo-dark.svg" alt="SpaceEdu" width={117} height={36} className={className} />
  );
}

/** Logo badge + wordmark, always the left-most item in the pill. */
export function HeaderBrand({ href, tone = "dark" }: { href: string; tone?: "dark" | "page" }) {
  if (tone === "page") {
    // The landing's pill follows the theme, so each theme gets its artwork.
    return (
      <Link href={href} aria-label="SpaceEdu" className="ld-focus flex shrink-0 items-center rounded-full pl-1 sm:pr-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
        <img src="/spaceedu-logo.svg" alt="" width={117} height={36} className="hidden h-9 w-auto sm:block dark:sm:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
        <img src="/spaceedu-logo-dark.svg" alt="" width={117} height={36} className="hidden h-9 w-auto dark:sm:block" />
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
        <img src="/spaceedu-mark.svg" alt="" width={36} height={36} className="h-9 w-9 sm:hidden dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
        <img src="/spaceedu-mark-dark.svg" alt="" width={36} height={36} className="hidden h-9 w-9 dark:block dark:sm:hidden" />
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="group flex shrink-0 items-center gap-2 rounded-full transition-opacity hover:opacity-90 sm:gap-2.5 sm:pr-2"
    >
      {/* The pill is dark in both themes, so always the -dark artwork: the
          light files' deep-green top book disappears on black. From `sm`
          the full logo (books + "SpaceEdu"); on a phone — only the landing
          shows the pill there — just the books, so the menu button fits. */}
      <BrandLogo className="hidden h-9 w-auto sm:block" />
      <img
        src="/spaceedu-mark-dark.svg"
        alt="SpaceEdu"
        width={36}
        height={36}
        className="h-9 w-9 sm:hidden"
      />
    </Link>
  );
}

/**
 * Centred link row. It appears at the `nav` breakpoint (55rem) rather than
 * `lg`: the row fits comfortably from about 860px, so hiding it until
 * 1024 left every small laptop without the header's navigation for no
 * reason. Below that it really doesn't fit, and clipping is worse than
 * absence — the bottom dock covers those widths.
 */
export function HeaderNav({ children }: { children: ReactNode }) {
  return (
    <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 nav:flex">
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
