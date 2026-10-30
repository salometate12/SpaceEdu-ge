"use client";

import { useEffect, useState } from "react";
import "./library.css";

export type ToolTab = "new" | "library";

function urlTab(): ToolTab | null {
  const value = new URLSearchParams(window.location.search).get("tab");
  return value === "new" || value === "library" ? value : null;
}

/**
 * Which tab a tool opens on: `?tab=` when it's there, „ახალი“ when
 * something was handed to it or `forceNew` (a preset source), otherwise
 * „ჩემი მასალები“ when anything is saved. Null until that's known. The
 * choice is written back to the URL without a navigation.
 */
export function useToolTab({ ready, hasItems, forceNew = false }: { ready: boolean; hasItems: boolean; forceNew?: boolean }) {
  const [tab, setTabState] = useState<ToolTab | null>(null);
  useEffect(() => {
    if (tab || !ready) return;
    const chosen = urlTab() ?? (forceNew ? "new" : hasItems ? "library" : "new");
    void Promise.resolve().then(() => setTabState(chosen));
  }, [tab, ready, hasItems, forceNew]);

  const setTab = (next: ToolTab) => {
    setTabState(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(window.history.state, "", url);
  };
  return [tab, setTab] as const;
}

/** „ახალი“ · „ჩემი მასალები“ (with how many are saved); full width on a phone. */
export function ToolTabs({ tab, count, onChange, className = "" }: { tab: ToolTab; count: number; onChange: (tab: ToolTab) => void; className?: string }) {
  const tabs: { id: ToolTab; label: string }[] = [
    { id: "new", label: "ახალი" },
    { id: "library", label: "ჩემი მასალები" },
  ];
  return (
    <div role="tablist" aria-label="ხედი" className={`lib flex gap-1 rounded-full border border-[var(--lib-border)] bg-[var(--lib-card)] p-1 max-sm:w-full sm:inline-flex ${className}`}>
      {tabs.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`lib-focus flex h-10 items-center justify-center gap-2 rounded-full px-5 text-[14.5px] font-semibold transition-colors max-sm:flex-1 ${
              active ? "bg-[var(--lib-strong)] text-[var(--lib-on-strong)]" : "text-[var(--lib-text)] hover:bg-[var(--lib-hover)]"
            }`}
          >
            {item.label}
            {item.id === "library" && count > 0 ? <span className="lib-count">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
