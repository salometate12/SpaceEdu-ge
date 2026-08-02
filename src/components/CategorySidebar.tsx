"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { DeckCategory } from "@/lib/types";
import type { SmartSpace } from "@/lib/smart-space";

interface CategorySidebarProps {
  selected: DeckCategory;
  onChange: (category: DeckCategory) => void;
  activeSpace: SmartSpace;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  category?: DeckCategory;
  href?: string;
}

const SPACE_ITEMS: Record<SmartSpace, SidebarItem[]> = {
  school: [
    { id: "school-math", icon: "📚", label: "მათემატიკა", category: "math" },
    { id: "school-chemistry", icon: "🧪", label: "ქიმია", category: "chemistry" },
    { id: "school-physics", icon: "🌌", label: "ფიზიკა", category: "physics" },
    { id: "school-biology", icon: "🌿", label: "ბიოლოგია", category: "biology" },
  ],
  exam: [
    { id: "exam-georgian", icon: "📖", label: "ქართული ლიტერატურა", category: "georgian" },
    { id: "exam-history", icon: "🏛️", label: "ისტორიის მკვლევარი", category: "history" },
    { id: "exam-english", icon: "🇬🇧", label: "ინგლისური ენა", href: "/english-assistant" },
    { id: "exam-civics", icon: "⚖️", label: "სამოქალაქო განათლება", category: "civic" },
  ],
  university: [
    { id: "uni-syllabus", icon: "📄", label: "სილაბუსის კონსპექტი" },
    { id: "uni-pdf", icon: "📂", label: "PDF მკვლევარი" },
    { id: "uni-translation", icon: "🌍", label: "აკადემიური თარგმანი" },
  ],
};

export function CategorySidebar({
  selected,
  onChange,
  activeSpace,
}: CategorySidebarProps) {
  const [accordionOpen, setAccordionOpen] = useState(true);
  const [activeUtilityItem, setActiveUtilityItem] = useState<string | null>(null);

  useEffect(() => {
    setActiveUtilityItem(null);
    setAccordionOpen(true);
  }, [activeSpace]);

  const spaceItems = useMemo(() => SPACE_ITEMS[activeSpace], [activeSpace]);

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <nav
        aria-label="საგნების ფილტრი"
        className="sticky top-24 rounded-2xl border border-white/20 bg-white/60 p-3 shadow-lg shadow-zinc-200/40 backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-900/60 dark:shadow-none"
      >
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          ნავიგაცია
        </p>
        <button
          type="button"
          onClick={() => setAccordionOpen((prev) => !prev)}
          className="group flex w-full items-center justify-between rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-2.5 text-left text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50/60 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:border-violet-800/50 dark:hover:bg-zinc-800/80"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-violet-100 group-hover:text-violet-600 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-violet-950/40 dark:group-hover:text-violet-300">
              🗂️
            </span>
            <span>ყველა საგანი</span>
          </span>
          {accordionOpen ? (
            <ChevronDown className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          )}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            accordionOpen ? "mt-2 max-h-[520px]" : "max-h-0"
          }`}
        >
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                onClick={() => onChange("all")}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  selected === "all"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                    : "text-zinc-600 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    selected === "all"
                      ? "bg-white/20 text-white"
                      : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700"
                  }`}
                >
                  <span className="text-xs font-semibold">ALL</span>
                </span>
                <span className="min-w-0 leading-snug">ყველა</span>
              </button>
            </li>
            {spaceItems.map((item) => {
              const isActive =
                item.category !== undefined
                  ? selected === item.category
                  : activeUtilityItem === item.id;

              const baseClassName = `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                isActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                  : "text-zinc-600 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
              }`;

              const iconClassName = `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700"
              }`;

              const content = (
                <>
                  <span className={iconClassName}>{item.icon}</span>
                  <span className="min-w-0 leading-snug">{item.label}</span>
                </>
              );

              if (item.href) {
                return (
                  <li key={item.id}>
                    <Link href={item.href} className={baseClassName}>
                      {content}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.category) {
                        onChange(item.category);
                        setActiveUtilityItem(null);
                        return;
                      }
                      onChange("all");
                      setActiveUtilityItem(item.id);
                    }}
                    className={baseClassName}
                  >
                    {content}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
