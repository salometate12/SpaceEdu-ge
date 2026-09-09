"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isPremiumAssistantPath } from "@/lib/assistant-routes";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { DashboardHeader } from "./DashboardHeader";
import { LandingHeader } from "./LandingHeader";

/**
 * Which surface the header floats over. The strip around the pill has to
 * be painted in that colour: it is sticky, so anything scrolling under it
 * shows through a transparent one — and the app's own background is the
 * wrong colour on the two pages that bring their own ground.
 */
type HeaderGround = "app" | "landing" | "paper";

const GROUND_CLASS: Record<HeaderGround, string> = {
  app: "bg-[var(--bg-primary)]",
  landing: "header-ground-landing",
  paper: "header-ground-paper",
};

interface HeaderProps {
  variant: "landing" | "dashboard";
  ground: HeaderGround;
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
  return <div className={`sticky top-0 z-40 ${GROUND_CLASS[ground]}`}>{header}</div>;
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
  // The landing lays its sections on a dark ground and /about on paper;
  // every other route uses the app background.
  const ground: HeaderGround =
    pathname === "/" ? "landing" : pathname === "/about" ? "paper" : "app";
  const landingVariant =
    pathname === "/" || pathname === "/pricing" || pathname === "/about";
  return (
    <Header variant={landingVariant ? "landing" : "dashboard"} ground={ground} />
  );
}
