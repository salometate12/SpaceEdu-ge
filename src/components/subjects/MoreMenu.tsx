"use client";

import { useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { useDismiss } from "@/hooks/useDismiss";

export interface MoreMenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

/** „⋯“ with a short list of actions; closes on a choice, a press outside or Escape. */
export function MoreMenu({ label, items, className = "" }: { label: string; items: MoreMenuItem[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), panel, trigger);
  return (
    <div className={`relative ${className}`}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="sj-focus flex h-9 w-9 items-center justify-center rounded-full text-[var(--sj-muted)] hover:bg-[var(--sj-hover)]"
      >
        <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden />
      </button>
      {open ? (
        <div ref={panel} role="menu" className="sj-menu absolute right-0 top-full z-30 mt-1 w-60 p-1.5">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`sj-menu-item sj-focus ${item.danger ? "!text-rose-600 dark:!text-rose-400" : ""}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
