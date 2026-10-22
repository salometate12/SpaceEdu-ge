"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Bell } from "lucide-react";
import { visibleNotifications, type AppNotification } from "@/lib/notification-feed";
import {
  ensureGeneratedNotifications,
  getAllNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_UPDATED_EVENT,
} from "@/lib/notifications";
import { NF_FOCUS, NotificationRow } from "./NotificationRow";

const BELL =
  "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-hover)] hover:text-white";

/** The unread count: a pink badge with a ring in the header's colour; 9+ past nine. */
function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#14141d] bg-[#e11d74] px-1 text-[11px] font-bold leading-none text-white"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/** Keeps Tab inside the popover while it's open. */
function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button, [href]")).filter(
    (element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0,
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * The header's bell with the unread count. On phones it goes straight to
 * /notifications; on wider screens it opens the last five in a popover.
 */
export function NotificationsBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setUnread(getUnreadCount());
    void Promise.resolve().then(() => {
      ensureGeneratedNotifications();
      sync();
    });
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const refresh = () => {
      setNow(new Date());
      setItems(visibleNotifications(getAllNotifications()).slice(0, 5));
    };
    refresh();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>("button, [href]")?.focus(), 0);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = unread > 0 ? `შეტყობინებები, ${unread} წაუკითხავი` : "შეტყობინებები";

  return (
    <div ref={rootRef} className="relative">
      <Link href="/notifications" aria-label={label} className={`${BELL} md:hidden`}>
        <Bell className="h-4 w-4" />
        <Badge count={unread} />
      </Link>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${BELL} hidden md:inline-flex`}
      >
        <Bell className="h-4 w-4" />
        <Badge count={unread} />
      </button>

      {open && now ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="შეტყობინებები"
          onKeyDown={trapFocus}
          className="nf absolute right-0 top-full z-50 mt-3 hidden w-[380px] overflow-hidden rounded-[20px] border border-[var(--nf-line)] bg-[var(--nf-card)] shadow-[0_24px_48px_-24px_rgb(15_23_42/0.45)] md:block"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--nf-divider)] px-4 py-3">
            <p className="text-[15px] font-bold text-[var(--nf-strong)]">შეტყობინებები</p>
            <button
              type="button"
              onClick={() => markAllNotificationsRead()}
              disabled={unread === 0}
              className={`rounded-full px-2 py-1 text-[13px] font-semibold text-[var(--nf-accent)] hover:underline disabled:opacity-45 ${NF_FOCUS}`}
            >
              ყველას წაკითხვა
            </button>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[14px] text-[var(--nf-muted)]">ახალი შეტყობინება არ გაქვს</p>
          ) : (
            <div className="max-h-[420px] divide-y divide-[var(--nf-divider)] overflow-y-auto">
              {items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  now={now}
                  compact
                  onOpen={(target) => {
                    markNotificationRead(target.id);
                    setOpen(false);
                    if (target.href) router.push(target.href);
                  }}
                />
              ))}
            </div>
          )}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className={`block border-t border-[var(--nf-divider)] px-4 py-3 text-center text-[13.5px] font-semibold text-[var(--nf-strong)] hover:bg-[var(--nf-hover)] ${NF_FOCUS}`}
          >
            ყველა შეტყობინება →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
