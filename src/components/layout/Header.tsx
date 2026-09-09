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
  return <div className="sticky top-0 z-40 hidden md:block">{header}</div>;
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
  const landingVariant = pathname === "/" || pathname === "/pricing";
  return <Header variant={landingVariant ? "landing" : "dashboard"} />;
}
