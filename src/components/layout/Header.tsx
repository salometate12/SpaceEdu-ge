"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isPremiumAssistantPath } from "@/lib/assistant-routes";
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

  return <div className="hidden md:block">{header}</div>;
}

export function HeaderByPath() {
  const pathname = usePathname();
  if (
    !pathname ||
    pathname === "/select-space" ||
    pathname === "/registration" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin") ||
    isPremiumAssistantPath(pathname)
  ) {
    return null;
  }
  const landingVariant = pathname === "/" || pathname === "/pricing";
  return <Header variant={landingVariant ? "landing" : "dashboard"} />;
}
