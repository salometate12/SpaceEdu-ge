"use client";

import { useEffect, useRef } from "react";
import type { DeckCategory } from "@/lib/types";
import { categoryNavItems } from "@/lib/category-nav";
import type { SmartSpace } from "@/lib/smart-space";

interface CategoryScrollBarProps {
  selected: DeckCategory;
  onChange: (category: DeckCategory) => void;
  activeSpace: SmartSpace;
}

const SPACE_CATEGORIES: Record<SmartSpace, DeckCategory[]> = {
  school: ["all", "math", "chemistry", "physics", "biology"],
  exam: ["all", "history", "geography", "georgian", "civic", "biology", "chemistry", "physics", "math"],
  university: ["all", "math", "civic"],
};

export function CategoryScrollBar({
  selected,
  onChange,
  activeSpace,
}: CategoryScrollBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const visibleCategoryItems = categoryNavItems.filter((item) =>
    SPACE_CATEGORIES[activeSpace].includes(item.value),
  );

  return (
    <div className="relative -mx-4 lg:hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[var(--background)] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[var(--background)] to-transparent"
      />

      <div
        ref={scrollRef}
        role="tablist"
        aria-label="საგნების ფილტრი"
        className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-1 pt-0.5"
      >
        {visibleCategoryItems.map(({ value, label, icon: Icon }) => {
          const isActive = selected === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(value)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "border-violet-500/50 bg-violet-600 text-white shadow-md shadow-violet-500/20"
                  : "border-zinc-200/80 bg-white/70 text-zinc-600 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-400"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
