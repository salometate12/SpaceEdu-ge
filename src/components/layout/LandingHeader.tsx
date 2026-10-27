"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  HeaderBrand,
  HeaderCta,
  HeaderNav,
  HeaderPill,
  headerNavItemClass,
} from "./HeaderPill";
import { LandingMobileMenu } from "./LandingMobileMenu";

interface LandingHeaderProps {
  scrolled: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

const NAV_LINKS = [
  // Each goes to its own card in „ვისთვის არის SpaceEdu“.
  { href: "/#school", label: "სკოლა" },
  { href: "/#exam", label: "გამოცდები" },
  { href: "/#university", label: "უნივერსიტეტი" },
  { href: "/#how-it-works", label: "როგორ მუშაობს" },
  { href: "/#pricing", label: "ფასები" },
  { href: "/about", label: "ჩვენს შესახებ" },
];


/**
 * A landing header nav link. In-page anchors (`/#…`) render as a plain <a>
 * so the browser's native hash scroll runs — it honours scroll-padding-top
 * and actually moves, which a same-page Next <Link> does not. Route links
 * (e.g. /about) keep <Link> for SPA navigation.
 */
function HeaderAnchorLink({
  href,
  label,
  className,
  onClick,
}: {
  href: string;
  label: string;
  className: string;
  onClick?: () => void;
}) {
  if (href.startsWith("/#")) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={className}>
      {label}
    </Link>
  );
}

export function LandingHeader({
  scrolled,
  mobileOpen,
  onToggleMobile,
}: LandingHeaderProps) {
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenu = () => {
    if (mobileOpen) onToggleMobile();
  };

  return (
    <>
      {/* Above the menu's dark ground: the bar stays, with its ✕. */}
      <div className="relative z-10">
        <HeaderPill scrolled={scrolled}>
          <HeaderBrand href="/" />

          <HeaderNav>
            {NAV_LINKS.map((item) => (
              <HeaderAnchorLink
                key={item.href}
                href={item.href}
                label={item.label}
                className={headerNavItemClass()}
              />
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
              ref={menuButtonRef}
              type="button"
              onClick={onToggleMobile}
              aria-expanded={mobileOpen}
              aria-controls="landing-mobile-menu"
              aria-label={mobileOpen ? "მენიუს დახურვა" : "მენიუ"}
              className={`inline-flex items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white nav:hidden ${
                mobileOpen ? "h-11 w-11 bg-white/[0.08] text-white" : "h-9 w-9"
              }`}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" strokeWidth={1.75} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </HeaderPill>
      </div>

      <LandingMobileMenu open={mobileOpen} onClose={closeMenu} returnFocusTo={menuButtonRef} />
    </>
  );
}
