"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isPremiumAssistantPath } from "@/lib/assistant-routes";
import { pageGround, type PageGround } from "@/lib/page-ground";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { DashboardHeader } from "./DashboardHeader";
import { LandingHeader } from "./LandingHeader";

/**
 * The strip around the pill has to be painted in the ground of the page it
 * floats over: it is sticky, so anything scrolling under it shows through
 * a transparent one — and the app's own background is the wrong colour on
 * the pages that bring their own. `pageGround` is shared with
 * `DocumentGround`, which paints the same colour behind the scrollbar.
 */
const GROUND_CLASS: Record<PageGround, string> = {
  app: "bg-[var(--bg-primary)]",
  landing: "header-ground-landing",
  paper: "header-ground-paper",
};

interface HeaderProps {
  variant: "landing" | "dashboard";
  ground: PageGround;
}

export function Header({ variant, ground }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const header =
    variant === "landing" ? (
      <LandingHeader
        scrolled={scrolled}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((prev) => !prev)}
      />
    ) : (
      <DashboardHeader
        scrolled={scrolled}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((prev) => !prev)}
      />
    );

  // `sticky` belongs on this wrapper, not on the <header> inside it: a
  // sticky element can only travel within its containing block, and that
  // block used to be this div — exactly as tall as the header, so the bar
  // scrolled straight off the screen.
  //
  // Phones get no header at all: the floating dock at the bottom of the
  // screen is the whole of mobile navigation, and it starts exactly where
  // this bar stops (`md`).
  return (
    <div className={`sticky top-0 z-40 hidden md:block ${GROUND_CLASS[ground]}`}>
      {header}
    </div>
  );
}

export function HeaderByPath() {
  const pathname = usePathname();
  const { focusMode } = useFocusMode();
  if (
    focusMode ||
    !pathname ||
    pathname === "/select-space" ||
    pathname === "/registration" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin") ||
    isPremiumAssistantPath(pathname)
  ) {
    return null;
  }
  const ground = pageGround(pathname);
  const landingVariant =
    pathname === "/" || pathname === "/pricing" || pathname === "/about";
  return (
    <Header variant={landingVariant ? "landing" : "dashboard"} ground={ground} />
  );
}
