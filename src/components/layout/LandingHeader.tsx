"use client";

import Link from "next/link";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
interface LandingHeaderProps {
  scrolled: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

export function LandingHeader({
  scrolled,
}: LandingHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-40 border-b px-4 transition-colors sm:px-6 ${
        scrolled
          ? "border-[var(--border-hover)] bg-[var(--header-scrolled-bg)] backdrop-blur-md"
          : "border-[var(--border)] bg-[var(--bg-primary)]"
      }`}
    >
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[#7C3AED]">
            <Rocket className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="headline text-base font-medium text-[var(--text-primary)]">
            SpaceEdu
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            { href: "/#school", label: "სკოლა" },
            { href: "/#exam", label: "გამოცდები" },
            { href: "/#university", label: "უნივერსიტეტი" },
            { href: "/#pricing", label: "ფასი" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[7px] px-3 py-1.5 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link href="/login">
            <button
              type="button"
              className="rounded-[8px] border border-[var(--border-hover)] bg-transparent px-3.5 py-1.5 text-[13px] text-[#94A3B8] hover:border-[#7C3AED] hover:text-[#a78bfa]"
            >
              შესვლა
            </button>
          </Link>
          <Link href="/select-space">
            <Button className="rounded-[8px] px-4 py-1.5 text-[13px]">დაიწყე უფასოდ ↗</Button>
          </Link>
        </div>


      </div>
    </header>
  );
}
