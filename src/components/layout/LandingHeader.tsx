"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
];

export function LandingHeader({ scrolled }: LandingHeaderProps) {
  return (
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
        <ThemeToggle className="!h-9 !w-9 sm:!h-9 sm:!w-9" />
        <Link
          href="/login"
          className="hidden h-10 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white sm:inline-flex"
        >
          შესვლა
        </Link>
        <HeaderCta href="/select-space">
          {/* The full label doesn't fit next to the wordmark on a 375px screen. */}
          <span className="sm:hidden">დაიწყე</span>
          <span className="hidden sm:inline">დაიწყე უფასოდ</span>
          <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5]" />
        </HeaderCta>
      </div>
    </HeaderPill>
  );
}
