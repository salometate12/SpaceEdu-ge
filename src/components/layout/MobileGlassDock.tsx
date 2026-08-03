"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";
import {
  isDockItemActive,
  mobileDockHidden,
  mobileDockItems,
} from "@/lib/mobile-nav";

const SCROLL_DOWN_THRESHOLD = 8;
const SCROLL_UP_THRESHOLD = 4;
const MIN_SCROLL_Y = 48;

export function MobileGlassDock() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const { isOpen: aiChatOpen, toggle: toggleAiChat } = useAIChatPanel();

  const items = mobileDockItems(pathname);
  const hidden = mobileDockHidden(pathname) || items.length === 0;

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY.current;

    if (delta > SCROLL_DOWN_THRESHOLD && currentY > MIN_SCROLL_Y) {
      setVisible(false);
    } else if (delta < -SCROLL_UP_THRESHOLD) {
      setVisible(true);
    }

    lastScrollY.current = currentY;
    ticking.current = false;
  }, []);

  useEffect(() => {
    if (hidden) return;

    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(handleScroll);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hidden, handleScroll]);

  useEffect(() => {
    setVisible(true);
    lastScrollY.current = window.scrollY;
  }, [pathname]);

  if (hidden) return null;

  return (
    <nav
      aria-label="მობილური ნავიგაცია"
      className={`fixed inset-x-0 bottom-0 z-50 block px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden transition-[transform,opacity] duration-300 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-1 rounded-2xl border border-white/20 bg-white/70 px-2 py-2 shadow-[0_8px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0f]/75 dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.href === "/ai-teacher") {
            return (
              <button
                key={item.href}
                type="button"
                onClick={toggleAiChat}
                aria-label={item.label}
                aria-pressed={aiChatOpen}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors ${
                  aiChatOpen
                    ? "bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                    : "text-slate-600 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-300"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 stroke-[1.75]" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          }

          const active = pathname ? isDockItemActive(pathname, item) : false;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors ${
                active
                  ? "bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                  : "text-slate-600 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-300"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 stroke-[1.75]" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <div className="flex shrink-0 flex-col items-center justify-center px-1">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

export function MobileGlassDockByPath() {
  return <MobileGlassDock />;
}
