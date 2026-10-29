"use client";

import { useEffect, useRef } from "react";
import { Check, Circle, X } from "lucide-react";
import type { FlashcardSession } from "@/lib/flashcard-session";
import type { Deck } from "@/lib/types";

/** Every card of the deck with where it stands, in a sheet from the side (from below on a phone). */
export function CardListSheet({ open, onClose, deck, session }: { open: boolean; onClose: () => void; deck: Deck; session: FlashcardSession }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const currentId = session.order[session.index];

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/40 max-md:items-end" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="ბარათების სია"
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-[420px] flex-col border-l border-[var(--gen-border)] bg-[var(--gen-card)] max-md:h-[80dvh] max-md:max-w-none max-md:rounded-t-[24px] max-md:border-l-0"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--gen-border)] px-5 py-4">
          <h2 className="text-[17px] font-bold text-[var(--gen-title)]">ბარათები · {deck.cards.length}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="დახურვა" className="gen-focus flex h-10 w-10 items-center justify-center rounded-full text-[var(--gen-muted)] hover:bg-[var(--gen-hover)]">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <ol className="flex-1 overflow-y-auto px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {deck.cards.map((card, index) => {
            const status = session.status[card.id];
            return (
              <li key={card.id} className={`flex items-start gap-3 rounded-[14px] px-3 py-3 ${card.id === currentId ? "bg-[var(--gen-soft)]" : ""}`}>
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    status === "known"
                      ? "bg-[#dcfce7] text-[#16a34a] dark:bg-[rgba(74,222,128,0.14)] dark:text-[#86efac]"
                      : status === "unknown"
                        ? "bg-[#ffe4e6] text-[#be123c] dark:bg-[rgba(244,63,94,0.14)] dark:text-[#fda4af]"
                        : "text-[var(--gen-faint)]"
                  }`}
                  aria-label={status === "known" ? "ვიცი" : status === "unknown" ? "გასამეორებელი" : "ჯერ არ გასულა"}
                >
                  {status === "known" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : status === "unknown" ? <X className="h-3.5 w-3.5" strokeWidth={3} /> : <Circle className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-[12px] font-semibold text-[var(--gen-faint)]">{index + 1}</span>
                  <span className="block text-[14.5px] font-semibold leading-snug text-[var(--gen-title)]">{card.question}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
