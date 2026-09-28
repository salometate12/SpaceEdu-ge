"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A small accessible confirmation dialog (role="dialog", aria-modal). Escape or
 * the backdrop cancels; when `confirmWord` is set the confirm button stays
 * disabled until the user types that exact word. Replaces window.confirm.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  confirmWord,
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmWord?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the typed word on every exit (event handlers, not an effect), so a
  // reopened dialog starts blank without syncing state inside an effect.
  const handleCancel = () => {
    setTyped("");
    onCancel();
  };
  const handleConfirm = () => {
    setTyped("");
    onConfirm();
  };

  useEffect(() => {
    if (!open) return;
    (confirmWord ? inputRef.current : confirmRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // handleCancel is stable enough for this one-shot open effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, confirmWord]);

  if (!open) return null;

  const ready = !confirmWord || typed.trim() === confirmWord;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={handleCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">{message}</p>

        {confirmWord && (
          <label className="mt-3 block">
            <span className="text-[11px] text-[var(--text-secondary)]">
              დასადასტურებლად ჩაწერე „{confirmWord}&rdquo;
            </span>
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-hover)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none focus:border-rose-500"
            />
          </label>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
          >
            გაუქმება
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={!ready}
            onClick={handleConfirm}
            className={`rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-colors disabled:opacity-50 ${
              danger ? "bg-rose-600 hover:bg-rose-700" : "bg-[#7F77DD] hover:bg-[#534AB7]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
