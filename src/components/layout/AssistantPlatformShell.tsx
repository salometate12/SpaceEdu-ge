"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import {
  ASSISTANT_NAV_ITEMS,
  assistantNavAccentClasses,
} from "@/lib/assistant-nav";
import {
  AssistantControlsProvider,
} from "./AssistantControlsContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardModeSwitcher } from "./DashboardModeSwitcher";
import {
  SCHOOL_SPACE_ITEMS,
  UNIVERSITY_SPACE_ITEMS,
  normalizeSmartSpace,
  type SmartSpace,
} from "@/lib/smart-space";

function SubjectNav({
  pathname,
  space,
}: {
  pathname: string;
  space: SmartSpace;
}) {
  if (space !== "exam") {
    const items = space === "school" ? SCHOOL_SPACE_ITEMS : UNIVERSITY_SPACE_ITEMS;
    return (
      <nav className="space-y-1" aria-label="სივრცის ხელსაწყოები">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="group flex w-full items-center gap-2.5 rounded-xl border border-zinc-200/70 bg-white/70 px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition-all hover:border-violet-200 hover:bg-violet-50/60 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-violet-800/50 dark:hover:bg-zinc-800/70"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-violet-100 group-hover:text-violet-600 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-violet-950/40 dark:group-hover:text-violet-300">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="leading-snug">{item.label}</span>
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="space-y-1" aria-label="საგანები">
      {ASSISTANT_NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const colors = assistantNavAccentClasses[item.accent];
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              active ? colors.active : colors.idle
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${active ? "text-white" : colors.icon}`}
            />
            <span className="leading-snug">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function MobileSubjectChips({
  pathname,
  space,
}: {
  pathname: string;
  space: SmartSpace;
}) {
  if (space !== "exam") {
    const items = space === "school" ? SCHOOL_SPACE_ITEMS : UNIVERSITY_SPACE_ITEMS;
    return (
      <div className="flex gap-1.5 pb-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-zinc-600 transition-all dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 pb-0.5">
      {ASSISTANT_NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const colors = assistantNavAccentClasses[item.accent];
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all ${
              active ? colors.active : colors.idle
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {item.shortLabel}
          </Link>
        );
      })}
    </div>
  );
}

import { isPremiumAssistantPath } from "@/lib/assistant-routes";

export function AssistantPlatformShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPremiumAssistant = isPremiumAssistantPath(pathname);
  const [controls, setControls] = useState<ReactNode>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(true);
  const [space, setSpace] = useState<SmartSpace>("exam");

  useEffect(() => {
    const saved = window.localStorage.getItem("spaceedu-assistant-topic-space");
    setSpace(normalizeSmartSpace(saved ?? undefined));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("spaceedu-assistant-topic-space", space);
  }, [space]);

  const activeSubject =
    space === "exam"
      ? ASSISTANT_NAV_ITEMS.find((item) => item.href === pathname)
      : null;

  if (isPremiumAssistant) {
    return (
      <AssistantControlsProvider
        setControls={setControls}
        space={space}
        setSpace={setSpace}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--bg-primary)]">
          {children}
        </div>
      </AssistantControlsProvider>
    );
  }

  return (
    <AssistantControlsProvider
      setControls={setControls}
      space={space}
      setSpace={setSpace}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Desktop sidebar — lg+ only */}
        <aside className="hidden w-80 shrink-0 flex-col overflow-hidden border-r border-zinc-200/60 bg-zinc-50/90 dark:border-zinc-800/60 dark:bg-zinc-950/90 xl:w-96 lg:flex">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 space-y-4 border-b border-zinc-200/60 px-5 py-5 dark:border-zinc-800/60">
              <div className="flex items-center justify-between gap-2">
                <DashboardModeSwitcher />
                <ThemeToggle />
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                  <GraduationCap className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    ასისტენტები
                  </p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    გამოცდა 2026
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="shrink-0 px-5 py-4">
                <SubjectNav pathname={pathname} space={space} />
              </div>
              {controls && (
                <>
                  <div className="mx-5 border-t border-zinc-200/70 dark:border-zinc-800/70" />
                  <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                    <div className="flex min-h-full flex-col">{controls}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main column: mobile header + content */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="shrink-0 border-b border-zinc-200/60 bg-zinc-50/95 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/95 lg:hidden">
            <div className="space-y-2.5 px-3 pb-3 pt-2.5">
              <div className="flex items-center justify-between gap-2">
                <DashboardModeSwitcher />
                <ThemeToggle />
              </div>
              <div className="scrollbar-thin -mx-1 overflow-x-auto px-1">
                <MobileSubjectChips pathname={pathname} space={space} />
              </div>
              {activeSubject && (
                <p className="truncate px-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {activeSubject.label}
                </p>
              )}
            </div>
          </header>

          <main
            className={`relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--background)] ${
              controls && mobilePanelOpen ? "max-lg:pb-[min(46dvh,19rem)]" : ""
            } ${controls && !mobilePanelOpen ? "max-lg:pb-14" : ""}`}
          >
            {children}

            {controls && (
              <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden">
                <div className="pointer-events-auto border-t border-zinc-200/80 bg-white/95 shadow-[0_-12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 pb-[env(safe-area-inset-bottom,0px)]">
                  <button
                    type="button"
                    onClick={() => setMobilePanelOpen((v) => !v)}
                    className="flex w-full items-center justify-center gap-1.5 border-b border-zinc-100 py-2.5 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                    aria-expanded={mobilePanelOpen}
                  >
                    {mobilePanelOpen ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        დამალვა
                      </>
                    ) : (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        ძებნა და კონტროლი
                      </>
                    )}
                  </button>
                  {mobilePanelOpen && (
                    <div className="scrollbar-thin max-h-[min(46dvh,19rem)] overflow-y-auto overscroll-contain px-4 py-3">
                      <div className="assistant-mobile-controls">{controls}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </AssistantControlsProvider>
  );
}
