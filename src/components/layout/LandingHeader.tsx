"use client";

import Link from "next/link";
import { ArrowUpRight, Rocket } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <header
      className={`sticky top-0 z-40 border-b px-4 transition-colors sm:px-6 ${
        scrolled
          ? "border-white/[0.08] bg-[#09090f]/85 backdrop-blur-xl"
          : "border-white/[0.05] bg-[#09090f]/60 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 shadow-[0_0_16px_rgba(124,58,237,0.4)]">
            <Rocket className="h-4 w-4 text-white" />
          </div>
          <span className="headline animate-gradient-text bg-gradient-to-r from-violet-300 via-indigo-300 to-cyan-300 bg-clip-text text-lg font-bold text-transparent">
            SpaceEdu
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <ThemeToggle />
          <Link href="/login">
            <button
              type="button"
              className="rounded-full border border-white/[0.1] bg-white/[0.02] px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:border-white/25 hover:text-white"
            >
              შესვლა
            </button>
          </Link>
          <Link href="/select-space">
            <button
              type="button"
              className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_18px_rgba(124,58,237,0.35)] transition-all hover:shadow-[0_0_26px_rgba(124,58,237,0.55)] active:scale-[0.98]"
            >
              დაიწყე უფასოდ
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[2.5] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
