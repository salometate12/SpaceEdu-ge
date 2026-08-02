"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Compass,
  FileText,
  Languages,
  Scale,
} from "lucide-react";
import {
  DASHBOARD_ABIT_HREF,
  dashboardHrefForSpace,
} from "@/lib/dashboard-routes";
import { readSpaceeduSpace } from "@/lib/space-back-navigation";
import { ASSISTANT_NAV_ITEMS } from "@/lib/assistant-nav";
import type { PremiumAssistantPath } from "@/lib/assistant-routes";
import { getAssistantSidebarConfig } from "@/lib/assistant-sidebar-config";
import type { AssistantHistoryEntry } from "@/lib/assistant-generation-history";

const NAV_ICONS = {
  "/lit-assistant": BookOpen,
  "/history-assistant": Compass,
  "/english-assistant": Languages,
  "/civics-assistant": Scale,
} as const;

interface AssistantPremiumSidebarProps {
  historyEntries: AssistantHistoryEntry[];
  onHistorySelect: (query: string) => void;
  onPillSelect: (query: string) => void;
  pillsDisabled?: boolean;
}

function truncateLabel(text: string, max = 32): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function AssistantPremiumSidebar({
  historyEntries,
  onHistorySelect,
  onPillSelect,
  pillsDisabled,
}: AssistantPremiumSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeRoute = pathname as PremiumAssistantPath;
  const config = getAssistantSidebarConfig(activeRoute);
  const [hubHref, setHubHref] = useState(DASHBOARD_ABIT_HREF);

  useEffect(() => {
    setHubHref(dashboardHrefForSpace(readSpaceeduSpace()));
  }, []);

  const handleBackToDashboard = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(dashboardHrefForSpace(readSpaceeduSpace()));
  };

  return (
    <aside className="flex h-full w-full shrink-0 flex-col justify-between border-b border-white/[0.06] bg-[#0d0d0f]/60 p-4 backdrop-blur-xl lg:w-80 lg:border-b-0 lg:border-r xl:w-[22rem]">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 space-y-3">
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="group mb-2 flex items-center gap-2 self-start px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-all hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-gray-500 transition-transform group-hover:-translate-x-0.5 group-hover:text-purple-400" />
            <span>დეშბორდზე დაბრუნება</span>
          </button>

          <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 text-xs">
            <Link
              href={hubHref}
              className="flex-1 rounded-lg px-3 py-1.5 text-center font-medium text-gray-400 transition hover:text-white"
            >
              სასწავლო ჰაბი
            </Link>
            <span className="flex-1 rounded-lg bg-white/[0.08] px-3 py-1.5 text-center font-medium text-white">
              AI ასისტენტები
            </span>
          </div>

          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            ასისტენტები • გამოცდა 2026
          </p>

          <nav className="flex flex-col gap-1" aria-label="ასისტენტების სია">
            {ASSISTANT_NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = NAV_ICONS[item.href as keyof typeof NAV_ICONS] ?? BookOpen;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "border border-purple-500/20 bg-purple-500/[0.08] text-purple-400"
                      : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                  <span className="leading-snug">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="my-4 flex min-h-0 flex-1 flex-col overflow-hidden border-t border-white/[0.04] pt-4">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            ბოლო კონსპექტები
          </p>
          <div className="assistant-history-scroll flex max-h-[200px] flex-col gap-1 overflow-y-auto pr-1">
            {historyEntries.length === 0 ? (
              <p className="px-2.5 py-2 text-xs text-gray-600">ჯერ არაფერია</p>
            ) : (
              historyEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  disabled={pillsDisabled}
                  onClick={() => onHistorySelect(entry.query)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-gray-400 transition-all hover:bg-purple-500/[0.04] hover:text-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
                  <span className="truncate">{truncateLabel(entry.query)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-white/[0.06] pt-4">
        <p className="px-2 text-[11px] leading-relaxed text-gray-500">
          {config.guideDescription}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5 px-1">
          {config.quickPills.map((pill) => (
            <button
              key={pill}
              type="button"
              disabled={pillsDisabled}
              onClick={() => onPillSelect(pill)}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-gray-400 transition-all hover:border-purple-500/40 hover:text-white disabled:opacity-50"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function AssistantQuickPills({
  route,
  onPillSelect,
  disabled,
}: {
  route: PremiumAssistantPath;
  onPillSelect: (query: string) => void;
  disabled?: boolean;
}) {
  const config = getAssistantSidebarConfig(route);

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-1.5 lg:hidden">
      {config.quickPills.map((pill) => (
        <button
          key={pill}
          type="button"
          disabled={disabled}
          onClick={() => onPillSelect(pill)}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-gray-400 transition-all hover:border-purple-500/40 hover:text-white disabled:opacity-50"
        >
          {pill}
        </button>
      ))}
    </div>
  );
}
