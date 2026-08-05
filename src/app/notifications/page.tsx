"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CalendarClock, Sparkles } from "lucide-react";
import {
  getAllNotifications,
  markAllNotificationsRead,
  NOTIFICATIONS_UPDATED_EVENT,
  type SiteNotification,
} from "@/lib/notifications";
import { DASHBOARD_ABIT_HREF, DASHBOARD_STUDENT_HREF } from "@/lib/dashboard-routes";

const TYPE_CONFIG: Record<
  SiteNotification["type"],
  { icon: typeof Sparkles; wrap: string; label: string }
> = {
  update: {
    icon: Sparkles,
    wrap: "bg-violet-100 text-violet-600 dark:bg-purple-500/15 dark:text-purple-300",
    label: "სიახლე",
  },
  "study-plan": {
    icon: CalendarClock,
    wrap: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300",
    label: "დღევანდელი გეგმა",
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<SiteNotification[]>([]);
  const [dashboardHref, setDashboardHref] = useState(DASHBOARD_ABIT_HREF);

  useEffect(() => {
    const sync = () => setNotifications(getAllNotifications());
    sync();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  useEffect(() => {
    const sync = () => {
      const saved = window.localStorage.getItem("spaceedu_space");
      if (saved === "student") setDashboardHref(DASHBOARD_STUDENT_HREF);
    };
    sync();
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-start gap-3">
        <Link
          href={dashboardHref}
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-white/[0.1] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-purple-400/30 dark:hover:bg-purple-500/10 dark:hover:text-white"
          aria-label="Dashboard"
        >
          ←
        </Link>
        <div>
          <h1 className="headline text-2xl font-bold text-slate-900 sm:text-3xl dark:text-zinc-100">
            შეტყობინებები
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
            საიტის სიახლეები და შენი დღიური სასწავლო შეხსენებები
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-14 text-center dark:border-white/[0.08]">
          <Bell className="h-6 w-6 text-slate-300 dark:text-zinc-600" strokeWidth={1.5} />
          <p className="text-sm text-slate-500 dark:text-zinc-500">
            ჯერ არაფერია — შეტყობინებები აქ გამოჩნდება.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => {
            const config = TYPE_CONFIG[item.type];
            const Icon = config.icon;
            return (
              <article
                key={item.id}
                className="dashboard-section flex items-start gap-3 p-4"
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.wrap}`}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-white/[0.06] dark:text-zinc-400">
                      {config.label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-500">{item.date}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-zinc-100">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{item.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
