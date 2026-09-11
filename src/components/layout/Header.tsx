"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isPremiumAssistantPath } from "@/lib/assistant-routes";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { DashboardHeader } from "./DashboardHeader";
import { LandingHeader } from "./LandingHeader";

interface HeaderProps {
  variant: "landing" | "dashboard";
}

export function Header({ variant }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 55rem)");
    const onChange = () => {
      if (media.matches) setMobileOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (variant !== "landing") return;
    document.documentElement.dataset.landingHeader = "true";
    return () => {
      delete document.documentElement.dataset.landingHeader;
    };
  }, [variant]);

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
  // The app still hides this bar on phones (the dock is the navigation
  // there). The landing keeps it so a plain menu can hold the same links
  // the desktop pill shows.
  //
  // The strip stays transparent so only the pill travels down the page —
  // a painted one would drag a full-width rectangle along with it. What
  // shows through above the first section is the document ground, which
  // `DocumentGround` keeps correct per route.
  return (
    <div
      className={`sticky top-0 z-40 ${
        variant === "landing" ? "block" : "hidden md:block"
      }`}
    >
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
  const landingVariant =
    pathname === "/" || pathname === "/pricing" || pathname === "/about";
  return <Header variant={landingVariant ? "landing" : "dashboard"} />;
}
