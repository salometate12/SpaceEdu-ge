"use client";

import { useEffect, useRef, useState } from "react";
import { psButton } from "@/components/profile/settings-ui";

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
        className="w-full max-w-sm rounded-[24px] border border-[var(--ps-border)] bg-[var(--ps-card)] p-6 shadow-[0_16px_40px_rgba(28,26,23,0.16)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[17px] font-bold text-[var(--ps-title)]">{title}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--ps-text)]">{message}</p>

        {confirmWord && (
          <label className="mt-4 flex flex-col gap-2">
            <span className="ps-label">
              დასადასტურებლად ჩაწერე „{confirmWord}&rdquo;
            </span>
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="ps-field"
            />
          </label>
        )}

        <div className="ps-actions mt-6">
          <button type="button" onClick={handleCancel} className={psButton("secondary")}>
            გაუქმება
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={!ready}
            onClick={handleConfirm}
            className={psButton(danger ? "danger" : "primary")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
