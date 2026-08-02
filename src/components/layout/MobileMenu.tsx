"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MobileMenuItem {
  label: string;
  href: string;
}

interface MobileMenuProps {
  open: boolean;
  items: MobileMenuItem[];
}

export function MobileMenu({ open, items }: MobileMenuProps) {
  if (!open) return null;
  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-primary)] px-6 py-4 animate-[fade-in-up_.2s_ease] lg:hidden">
      <div className="mb-3 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
        <span className="text-xs text-[var(--text-secondary)]">თემა</span>
        <ThemeToggle showLabel />
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-primary)]"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

