"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A small dropdown: the trigger toggles it; a click outside or Esc closes
 * it. Children get `close` so an item can close the menu after acting.
 */
export function Menu({
  trigger,
  children,
  align = "right",
  className = "",
  panelClassName = "w-56",
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`} data-editor-keep>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open ? (
        <div
          role="menu"
          className={`absolute top-full z-40 mt-1.5 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-1.5 text-sm shadow-xl dark:border-white/10 dark:bg-zinc-900 ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({
  icon,
  children,
  onClick,
  disabled,
  danger,
  active,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          : active
            ? "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300"
            : "text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
      }`}
    >
      {icon ? <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span> : null}
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

export const MenuLabel = ({ children }: { children: ReactNode }) => (
  <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-zinc-500">{children}</p>
);

export interface ToastMessage {
  id: number;
  text: string;
  tone?: "default" | "error";
  action?: { label: string; run: () => void };
  /** ms; default 2.5 s, 5 s with an action. */
  duration?: number;
}

/** One toast at a time, bottom centre, above the mobile dock. */
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const counter = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = (message: Omit<ToastMessage, "id">) => {
    counter.current += 1;
    const next = { ...message, id: counter.current };
    setToast(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => setToast((current) => (current?.id === next.id ? null : current)),
      message.duration ?? (message.action ? 5000 : 2500),
    );
  };

  const element = toast ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-[90] flex justify-center px-4 md:bottom-8"
    >
      <div
        className={`flex max-w-md items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium shadow-xl ${
          toast.tone === "error" ? "bg-rose-600 text-white" : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
        }`}
      >
        <span>{toast.text}</span>
        {toast.action ? (
          <button
            type="button"
            onClick={() => {
              toast.action?.run();
              setToast(null);
            }}
            className="font-semibold text-pink-300 underline-offset-2 hover:underline dark:text-pink-600"
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>
    </div>
  ) : null;

  return { show, element, dismiss: () => setToast(null) };
}
