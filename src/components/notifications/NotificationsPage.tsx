"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, ChevronDown, Settings } from "lucide-react";
import { Toast } from "@/components/ui/Toast";
import { DASHBOARD_ABIT_HREF, DASHBOARD_STUDENT_HREF } from "@/lib/dashboard-routes";
import {
  foldedPlanSummary,
  groupFeed,
  localDay,
  parseFilter,
  unreadCount,
  visibleNotifications,
  type AppNotification,
  type FeedRow,
  type NotificationFilter,
} from "@/lib/notification-feed";
import {
  deleteNotification,
  ensureGeneratedNotifications,
  getAllNotifications,
  isPlanDayDone,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsRead,
  markNotificationUnread,
  markPlanDayDone,
  NOTIFICATIONS_UPDATED_EVENT,
  restoreNotification,
} from "@/lib/notifications";
import { SETTINGS_NOTIFICATIONS_HREF } from "@/lib/settings-nav";
import { KindTile, NF_FOCUS, NotificationRow } from "./NotificationRow";

const TABS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "ყველა" },
  { id: "reminders", label: "შეხსენებები" },
  { id: "deadlines", label: "დედლაინები" },
  { id: "news", label: "სიახლეები" },
];

/** „გეგმის შეხსენებები · 4“ — older plan reminders in one row that opens up. */
function FoldedPlans({
  items,
  open,
  onToggle,
  now,
  onOpen,
  onToggleRead,
  onDelete,
}: {
  items: AppNotification[];
  open: boolean;
  onToggle: () => void;
  now: Date;
  onOpen: (item: AppNotification) => void;
  onToggleRead: (item: AppNotification) => void;
  onDelete: (item: AppNotification) => void;
}) {
  const unread = items.some((item) => !item.readAt);
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-start gap-3 bg-[var(--nf-card)] px-3.5 py-3.5 text-left transition-colors hover:bg-[var(--nf-hover)] sm:px-4 sm:py-4 ${NF_FOCUS}`}
      >
        <KindTile kind="plan" />
        <span className="min-w-0 flex-1">
          <span className={`block text-[14.5px] leading-snug sm:text-[15px] ${unread ? "font-bold text-[var(--nf-strong)]" : "font-semibold text-[var(--nf-read)]"}`}>
            გეგმის შეხსენებები · {items.length}
          </span>
          <span className="mt-0.5 block truncate text-[14px] text-[var(--nf-body)]">{foldedPlanSummary(items)}</span>
        </span>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-[var(--nf-muted)] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (
        <div className="divide-y divide-[var(--nf-divider)] border-t border-[var(--nf-divider)] pl-6">
          {items.map((item) => (
            <NotificationRow key={item.id} item={item} now={now} compact onOpen={onOpen} onToggleRead={onToggleRead} onDelete={onDelete} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * /notifications: the list by day (today, yesterday, this week, earlier —
 * folded), filter tabs kept in the URL (`?f=`), unread marked with a pink
 * dot, today's plan reminder with „გეგმის გახსნა“ / „✓ შესრულებულია“.
 */
export function NotificationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filter = parseFilter(searchParams.get("f"));
  const [list, setList] = useState<AppNotification[] | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [earlierOpen, setEarlierOpen] = useState(false);
  const [openFolds, setOpenFolds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; undoId?: string } | null>(null);
  const [dashboardHref, setDashboardHref] = useState(DASHBOARD_STUDENT_HREF);

  useEffect(() => {
    const sync = () => {
      setNow(new Date());
      setList(getAllNotifications());
    };
    void Promise.resolve().then(() => {
      ensureGeneratedNotifications();
      sync();
      if (window.localStorage.getItem("spaceedu_space") === "abiturient") setDashboardHref(DASHBOARD_ABIT_HREF);
    });
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const shown = useMemo(() => (list ? visibleNotifications(list, filter) : []), [list, filter]);
  const groups = useMemo(() => (now ? groupFeed(shown, now) : []), [shown, now]);
  const unread = list ? unreadCount(list) : 0;
  const closeToast = useCallback(() => setToast(null), []);

  const setFilter = (next: NotificationFilter) =>
    router.replace(next === "all" ? pathname : `${pathname}?f=${next}`, { scroll: false });

  const open = (item: AppNotification) => {
    markNotificationRead(item.id);
    if (item.href) router.push(item.href);
  };

  const act = (item: AppNotification, action: "open" | "done") => {
    if (action === "open") {
      open(item);
      return;
    }
    if (markPlanDayDone(item)) setToast({ message: "დღე შესრულდა" });
  };

  const toggleRead = (item: AppNotification) => (item.readAt ? markNotificationUnread(item.id) : markNotificationRead(item.id));

  const remove = (item: AppNotification) => {
    deleteNotification(item.id);
    setToast({ message: "შეტყობინება წაიშალა", undoId: item.id });
  };

  const isToday = (item: AppNotification) => !!now && localDay(new Date(item.createdAt)) === localDay(now);

  const renderRow = (row: FeedRow) =>
    row.type === "plans" ? (
      <FoldedPlans
        key={row.id}
        items={row.items}
        open={openFolds.has(row.id)}
        onToggle={() => {
          setOpenFolds((current) => {
            const next = new Set(current);
            if (next.has(row.id)) next.delete(row.id);
            else next.add(row.id);
            return next;
          });
          markNotificationsRead(row.items.map((item) => item.id));
        }}
        now={now!}
        onOpen={open}
        onToggleRead={toggleRead}
        onDelete={remove}
      />
    ) : (
      <NotificationRow
        key={row.item.id}
        item={row.item}
        now={now!}
        showActions={row.item.kind === "plan" && isToday(row.item) && Boolean(row.item.actions?.length)}
        planDone={row.item.kind === "plan" && isPlanDayDone(row.item)}
        onOpen={open}
        onAction={act}
        onToggleRead={toggleRead}
        onDelete={remove}
      />
    );

  return (
    // Phones: the page colour also runs under the shell's dock padding.
    <div className="nf under-site-header min-h-dvh bg-[var(--nf-bg)] max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 pb-16 pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pt-10">
        <header className="flex items-center gap-3">
          <Link
            href={dashboardHref}
            aria-label="დეშბორდზე დაბრუნება"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--nf-line)] bg-[var(--nf-card)] text-[var(--nf-strong)] transition-colors hover:border-[var(--nf-muted)] ${NF_FOCUS}`}
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-[20px] font-bold text-[var(--nf-strong)] min-[400px]:text-[22px] sm:text-[26px]">შეტყობინებები</h1>
          <button
            type="button"
            onClick={() => markAllNotificationsRead()}
            disabled={unread === 0}
            className={`inline-flex h-9 items-center rounded-full px-3 text-[13.5px] font-semibold text-[var(--nf-strong)] transition-colors hover:bg-[var(--nf-soft)] disabled:opacity-45 max-sm:px-2 max-sm:text-[var(--nf-accent)] ${NF_FOCUS}`}
          >
            <span className="sm:hidden">წაკითხვა</span>
            <span className="max-sm:hidden">ყველას წაკითხვა</span>
          </button>
          {/* Phones: only „წაკითხვა“ (the settings link is under the list there). */}
          <Link
            href={SETTINGS_NOTIFICATIONS_HREF}
            aria-label="შეტყობინებების პარამეტრები"
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border max-sm:hidden border-[var(--nf-line)] bg-[var(--nf-card)] text-[var(--nf-muted)] transition-colors hover:text-[var(--nf-strong)] ${NF_FOCUS}`}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </header>

        <div role="tablist" aria-label="ფილტრი" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={`inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13.5px] font-semibold transition-colors ${NF_FOCUS} ${
                  active
                    ? "bg-[var(--nf-ink)] text-[var(--nf-ink-text)]"
                    : "border border-[var(--nf-line)] bg-[var(--nf-card)] text-[var(--nf-strong)] hover:border-[var(--nf-muted)]"
                }`}
              >
                {tab.label}
                {tab.id === "all" && unread > 0 ? ` · ${unread} ახალი` : ""}
              </button>
            );
          })}
        </div>

        {list === null ? (
          <div className="h-40 animate-pulse rounded-[20px] bg-[var(--nf-card)] motion-reduce:animate-none" aria-busy />
        ) : groups.length === 0 ? (
          <section className="flex flex-col items-center gap-3 rounded-[20px] border border-[var(--nf-card-border)] bg-[var(--nf-card)] px-6 py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--nf-soft)] text-[var(--nf-muted)]" aria-hidden>
              <Bell className="h-5 w-5" />
            </span>
            <p className="text-[15px] font-semibold text-[var(--nf-strong)]">ახალი შეტყობინება არ გაქვს</p>
            <Link href={SETTINGS_NOTIFICATIONS_HREF} className={`rounded-full text-[13.5px] font-semibold text-[var(--nf-accent)] hover:underline ${NF_FOCUS}`}>
              შეხსენებების პარამეტრები →
            </Link>
          </section>
        ) : (
          groups.map((group) =>
            group.id === "earlier" && !earlierOpen ? (
              <button
                key={group.id}
                type="button"
                onClick={() => setEarlierOpen(true)}
                aria-expanded={false}
                className={`flex items-center justify-between rounded-[20px] border border-[var(--nf-card-border)] bg-[var(--nf-card)] px-4 py-3.5 text-left text-[14px] font-semibold text-[var(--nf-strong)] transition-colors hover:bg-[var(--nf-hover)] ${NF_FOCUS}`}
              >
                ადრეული · {group.count}
                <ChevronDown className="h-4 w-4 text-[var(--nf-muted)]" aria-hidden />
              </button>
            ) : (
              <section key={group.id} aria-labelledby={`nf-${group.id}`}>
                <h2 id={`nf-${group.id}`} className="mb-2 px-1 text-[13px] font-bold text-[var(--nf-muted)]">
                  {group.label}
                </h2>
                <div className="divide-y divide-[var(--nf-divider)] overflow-hidden rounded-[20px] border border-[var(--nf-card-border)] bg-[var(--nf-card)]">
                  {group.rows.map(renderRow)}
                </div>
              </section>
            ),
          )
        )}
        {list !== null && groups.length > 0 ? (
          <Link href={SETTINGS_NOTIFICATIONS_HREF} className={`self-center rounded-full text-[13.5px] font-semibold text-[var(--nf-accent)] hover:underline sm:hidden ${NF_FOCUS}`}>
            შეხსენებების პარამეტრები →
          </Link>
        ) : null}
      </div>

      {toast ? (
        <Toast
          message={toast.message}
          actionLabel={toast.undoId ? "დაბრუნება" : undefined}
          onAction={
            toast.undoId
              ? () => {
                  restoreNotification(toast.undoId!);
                  setToast(null);
                }
              : undefined
          }
          onClose={closeToast}
        />
      ) : null}
    </div>
  );
}
