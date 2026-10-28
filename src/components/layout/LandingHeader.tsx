"use client";

import Link from "next/link";
import { useRef } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeaderBrand, HeaderNav, HeaderPill } from "./HeaderPill";
import { LandingMobileMenu } from "./LandingMobileMenu";
import "@/components/landing/landing.css";

interface LandingHeaderProps {
  scrolled: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

const NAV_LINKS = [
  { href: "/#features", label: "ხელსაწყოები" },
  { href: "/#exam", label: "აბიტურიენტი" },
  { href: "/#pricing", label: "ფასები" },
  { href: "/about", label: "ჩვენს შესახებ" },
];

const NAV_ITEM_CLASS =
  "ld-focus shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[14.5px] font-semibold text-[var(--ld-text)] transition-colors hover:bg-[var(--ld-soft)] hover:text-[var(--ld-title)]";


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
        <HeaderPill scrolled={scrolled} tone="page">
          <HeaderBrand href="/" tone="page" />

          <HeaderNav>
            {NAV_LINKS.map((item) => (
              <HeaderAnchorLink
                key={item.href}
                href={item.href}
                label={item.label}
                className={NAV_ITEM_CLASS}
              />
            ))}
          </HeaderNav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:ml-0">
            <div className="hidden items-center gap-1.5 md:flex sm:gap-2">
              <ThemeToggle className="ld-focus !h-11 !w-11 !border-[var(--ld-card-border)] !bg-[var(--ld-card)]" />
              <Link
                href="/login"
                className="ld-focus hidden h-11 items-center whitespace-nowrap rounded-full px-4 text-[14.5px] font-semibold text-[var(--ld-text)] transition-colors hover:bg-[var(--ld-soft)] hover:text-[var(--ld-title)] lg:inline-flex"
              >
                შესვლა
              </Link>
              <Link
                href="/select-space"
                className="ld-primary ld-focus inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full px-5 text-[14.5px] font-semibold transition-colors"
              >
                დაწყება
              </Link>
            </div>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={onToggleMobile}
              aria-expanded={mobileOpen}
              aria-controls="landing-mobile-menu"
              aria-label={mobileOpen ? "მენიუს დახურვა" : "მენიუ"}
              className="ld-focus inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ld-soft)] text-[var(--ld-title)] transition-colors nav:hidden"
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
