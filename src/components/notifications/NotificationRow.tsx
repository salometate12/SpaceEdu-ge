"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { CalendarCheck, Check, Clock, Flame, Info, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";
import { formatNotificationTime, type AppNotification, type NotificationKind } from "@/lib/notification-feed";
import "./notifications.css";

export const NF_FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nf-accent)]/40";

const KIND_LOOK: Record<NotificationKind, { icon: typeof Info; tile: string; fill?: string }> = {
  plan: { icon: CalendarCheck, tile: "bg-[var(--nf-plan-bg)] text-[var(--nf-plan)]" },
  deadline: { icon: Clock, tile: "bg-[var(--nf-deadline-bg)] text-[var(--nf-deadline)]" },
  streak: { icon: Flame, tile: "bg-[var(--nf-streak-bg)] text-[var(--nf-streak)]", fill: "var(--nf-streak-fill)" },
  news: { icon: Sparkles, tile: "bg-[var(--nf-news-bg)] text-[var(--nf-news)]" },
  system: { icon: Info, tile: "bg-[var(--nf-system-bg)] text-[var(--nf-system)]" },
};

/** The kind's tinted tile with its icon. */
export function KindTile({ kind, size = 38 }: { kind: NotificationKind; size?: number }) {
  const look = KIND_LOOK[kind];
  const Icon = look.icon;
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-[12px] ${look.tile}`} style={{ width: size, height: size }}>
      <Icon style={{ width: size * 0.47, height: size * 0.47 }} strokeWidth={2} fill={look.fill ?? "none"} />
    </span>
  );
}

const SWIPE_REVEAL = 88;

/**
 * One notification: the kind's tile, title (bold with a pink dot while
 * unread), body, today's plan actions, and the time. A tap marks it read
 * and opens it. Wider screens: ⋯ on hover (read/unread, delete); phones:
 * swipe left for „წაშლა“.
 */
export function NotificationRow({
  item,
  now,
  compact = false,
  showActions = false,
  planDone = false,
  onOpen,
  onAction,
  onToggleRead,
  onDelete,
}: {
  item: AppNotification;
  now: Date;
  compact?: boolean;
  /** Today's plan reminder: „გეგმის გახსნა“ and „✓ შესრულებულია“. */
  showActions?: boolean;
  planDone?: boolean;
  onOpen: (item: AppNotification) => void;
  onAction?: (item: AppNotification, action: "open" | "done") => void;
  onToggleRead?: (item: AppNotification) => void;
  onDelete?: (item: AppNotification) => void;
}) {
  const unread = !item.readAt;
  const [menu, setMenu] = useState(false);
  const [offset, setOffset] = useState(0);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  // Phones: swipe left reveals „წაშლა“.
  const onPointerDown = (event: ReactPointerEvent) => {
    if (event.pointerType !== "touch" || !onDelete) return;
    drag.current = { x: event.clientX, y: event.clientY, moved: false };
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(event.clientY - start.y) > Math.abs(dx)) return;
    if (Math.abs(dx) > 8) start.moved = true;
    setOffset(Math.max(-SWIPE_REVEAL, Math.min(0, dx + (offset === -SWIPE_REVEAL ? -SWIPE_REVEAL : 0))));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    setOffset((current) => (current < -SWIPE_REVEAL / 2 ? -SWIPE_REVEAL : 0));
    window.setTimeout(() => {
      drag.current = null;
    }, 0);
  };

  const tileSize = compact ? 34 : 38;
  return (
    <div className="relative overflow-hidden">
      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(item)}
          tabIndex={offset === 0 ? -1 : 0}
          aria-hidden={offset === 0}
          className="absolute inset-y-0 right-0 flex w-[88px] items-center justify-center gap-1 bg-rose-600 text-[13px] font-semibold text-white md:hidden"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          წაშლა
        </button>
      ) : null}
      <div
        data-notification={item.id}
        data-unread={unread || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ transform: offset ? `translateX(${offset}px)` : undefined }}
        className={`group relative flex touch-pan-y items-start gap-3 bg-[var(--nf-card)] transition-[background-color,transform] duration-150 hover:bg-[var(--nf-hover)] motion-reduce:transition-none ${
          compact ? `px-4 py-3 ${unread ? "bg-[var(--nf-unread-row)] hover:bg-[var(--nf-unread-row)]" : ""}` : "px-3.5 py-3.5 sm:px-4 sm:py-4"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (drag.current?.moved || offset !== 0) {
              setOffset(0);
              return;
            }
            onOpen(item);
          }}
          className={`absolute inset-0 z-0 rounded-none ${NF_FOCUS}`}
          aria-label={`${item.title}${unread ? " — წაუკითხავი" : ""}`}
        />
        <KindTile kind={item.kind} size={tileSize} />
        <div className="pointer-events-none relative z-[1] min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p
              className={`min-w-0 flex-1 leading-snug ${compact ? "text-[14px]" : "text-[14.5px] sm:text-[15px]"} ${
                unread ? "font-bold text-[var(--nf-strong)]" : "font-semibold text-[var(--nf-read)]"
              }`}
            >
              {item.title}
              {unread ? <span aria-label="წაუკითხავი" role="img" className="ml-2 inline-block h-2 w-2 rounded-full bg-[var(--nf-accent)] align-middle" /> : null}
            </p>
            <span className="shrink-0 pt-0.5 text-[12.5px] tabular-nums text-[var(--nf-muted)]">{formatNotificationTime(item.createdAt, now)}</span>
          </div>
          {item.body ? (
            <p className={`mt-0.5 text-[var(--nf-body)] ${compact ? "line-clamp-1 text-[13px]" : "text-[14px] leading-[1.55]"}`}>{item.body}</p>
          ) : null}
          {showActions && onAction ? (
            <div className="pointer-events-auto mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onAction(item, "open")}
                className={`inline-flex h-[30px] items-center rounded-full bg-[var(--nf-ink)] px-3 text-[12.5px] font-semibold text-[var(--nf-ink-text)] transition-opacity hover:opacity-90 sm:h-8 ${NF_FOCUS}`}
              >
                გეგმის გახსნა
              </button>
              <button
                type="button"
                onClick={() => onAction(item, "done")}
                disabled={planDone}
                className={`inline-flex h-[30px] items-center gap-1 rounded-full border border-[var(--nf-line)] bg-[var(--nf-card)] px-3 text-[12.5px] font-semibold text-[var(--nf-strong)] transition-colors hover:border-[var(--nf-muted)] disabled:opacity-60 sm:h-8 ${NF_FOCUS}`}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden />
                შესრულებულია
              </button>
            </div>
          ) : null}
        </div>
        {onToggleRead || onDelete ? (
          <div ref={menuRef} className="relative z-[2] -mr-1 hidden md:block">
            <button
              type="button"
              onClick={() => setMenu((open) => !open)}
              aria-label={`მოქმედებები: ${item.title}`}
              aria-haspopup="menu"
              aria-expanded={menu}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--nf-muted)] transition-opacity hover:bg-[var(--nf-soft)] hover:text-[var(--nf-strong)] ${
                menu ? "opacity-100" : "opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
              } ${NF_FOCUS}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menu ? (
              <div role="menu" className="absolute right-0 top-9 z-20 w-48 rounded-[14px] border border-[var(--nf-line)] bg-[var(--nf-card)] p-1.5 text-[13.5px] shadow-[0_12px_32px_-12px_rgb(15_23_42/0.3)]">
                {onToggleRead ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      onToggleRead(item);
                    }}
                    className={`flex w-full items-center rounded-[10px] px-3 py-2 text-left text-[var(--nf-strong)] hover:bg-[var(--nf-soft)] ${NF_FOCUS}`}
                  >
                    {unread ? "წაკითხულად მონიშვნა" : "წაუკითხავად მონიშვნა"}
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false);
                      onDelete(item);
                    }}
                    className={`flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 ${NF_FOCUS}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    წაშლა
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
