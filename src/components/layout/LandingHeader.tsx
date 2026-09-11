"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  HeaderBrand,
  HeaderCta,
  HeaderNav,
  HeaderPill,
  headerNavItemClass,
} from "./HeaderPill";

interface LandingHeaderProps {
  scrolled: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

const NAV_LINKS = [
  { href: "/#school", label: "სკოლა" },
  { href: "/#exam", label: "გამოცდები" },
  { href: "/#university", label: "უნივერსიტეტი" },
  { href: "/#how-it-works", label: "როგორ მუშაობს" },
  { href: "/#pricing", label: "ფასი" },
  { href: "/about", label: "ჩვენს შესახებ" },
];

const MENU_ACTIONS = [
  { href: "/login", label: "შესვლა" },
  { href: "/select-space", label: "დაიწყე უფასოდ" },
];

export function LandingHeader({
  scrolled,
  mobileOpen,
  onToggleMobile,
}: LandingHeaderProps) {
  const closeMenu = () => {
    if (mobileOpen) onToggleMobile();
  };

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onToggleMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onToggleMobile]);

  return (
    <>
      <HeaderPill scrolled={scrolled}>
        <HeaderBrand href="/" />

        <HeaderNav>
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className={headerNavItemClass()}>
              {item.label}
            </Link>
          ))}
        </HeaderNav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:ml-0">
          <div className="hidden items-center gap-1.5 md:flex sm:gap-2">
            <ThemeToggle className="!h-9 !w-9 sm:!h-9 sm:!w-9" />
            <Link
              href="/login"
              className="hidden h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white xl:inline-flex"
            >
              შესვლა
            </Link>
            <HeaderCta href="/select-space">
              <span className="sm:hidden">დაიწყე</span>
              <span className="hidden sm:inline">დაიწყე უფასოდ</span>
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
            </HeaderCta>
          </div>

          <button
            type="button"
            onClick={onToggleMobile}
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
            aria-label={mobileOpen ? "მენიუს დახურვა" : "მენიუ"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white nav:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </HeaderPill>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/25 nav:hidden"
            aria-label="მენიუს დახურვა"
            onClick={closeMenu}
          />
          <nav
            id="landing-mobile-menu"
            className="relative z-[41] mx-3 mb-2 rounded-2xl border border-white/[0.08] bg-[#111118] px-1.5 py-1.5 nav:hidden"
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="block rounded-xl px-3.5 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <div className="mx-3.5 my-1.5 h-px bg-white/[0.08]" />
            {MENU_ACTIONS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="block rounded-xl px-3.5 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      ) : null}
    </>
  );
}
