"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Flame, Swords } from "lucide-react";
import {
  DAILY_QUESTS_UPDATED_EVENT,
  loadDailyQuests,
  type DailyQuestView,
} from "@/lib/daily-quests";
import { getCurrentStreak, STREAK_UPDATED_EVENT } from "@/lib/daily-streak";

export function DailyQuests() {
  const [quests, setQuests] = useState<DailyQuestView[]>([]);
  const [streak, setStreak] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      setQuests(loadDailyQuests());
      setStreak(getCurrentStreak());
      setHydrated(true);
    };
    sync();
    window.addEventListener(DAILY_QUESTS_UPDATED_EVENT, sync);
    window.addEventListener(STREAK_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DAILY_QUESTS_UPDATED_EVENT, sync);
      window.removeEventListener(STREAK_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const done = quests.filter((quest) => quest.completed).length;
  const allDone = hydrated && quests.length > 0 && done === quests.length;

  return (
    <section className="dashboard-section p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Swords className="h-6 w-6 text-amber-500 dark:text-amber-400" strokeWidth={1.5} />
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              დღიური გამოწვევები
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              {allDone
                ? "ყველა დღევანდელი გამოწვევა შესრულებულია — სტრიქი დაცულია."
                : "შეასრულე დღის სამიზნეები და შეინარჩუნე სტრიქი."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
            <Flame className="h-3.5 w-3.5 stroke-[2]" />
            {streak} დღე
          </span>
          <span className="inline-flex rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
            {done}/{quests.length || 3}
          </span>
        </div>
      </div>

      {hydrated && (
        <ul className="grid gap-2.5 sm:grid-cols-3">
          {quests.map((quest, questIndex) => {
            const percent = Math.round((quest.progress / quest.target) * 100);
            return (
              <motion.li
                key={quest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: questIndex * 0.06, duration: 0.3 }}
                className={`relative overflow-hidden rounded-2xl border p-4 transition-colors ${
                  quest.completed
                    ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-400/25 dark:bg-emerald-500/[0.07]"
                    : "border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      quest.completed
                        ? "text-emerald-800 dark:text-emerald-200"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {quest.label}
                  </span>
                  {quest.completed && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
                  {quest.completed ? quest.reward : quest.description}
                </p>

                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/[0.07]">
                  <motion.div
                    className={`h-full rounded-full ${
                      quest.completed ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tabular-nums text-slate-400 dark:text-zinc-600">
                    {quest.progress}/{quest.target}
                  </span>
                  {!quest.completed && (
                    <Link
                      href={quest.href}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 transition hover:text-amber-500 dark:text-amber-400"
                    >
                      დაწყება
                      <ArrowRight className="h-3 w-3 stroke-[2.5]" />
                    </Link>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
