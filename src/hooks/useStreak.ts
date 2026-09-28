"use client";

import { useEffect, useState } from "react";
import {
  getActiveDatesThisWeek,
  getCurrentStreak,
  getLongestStreak,
  getTotalActiveDays,
  STREAK_UPDATED_EVENT,
} from "@/lib/daily-streak";

export interface StreakSnapshot {
  /** False until read on the client — callers show a placeholder, not 0. */
  ready: boolean;
  current: number;
  best: number;
  /** Whether today already counts toward the streak. */
  activeToday: boolean;
  totalDays: number;
}

const EMPTY: StreakSnapshot = {
  ready: false,
  current: 0,
  best: 0,
  activeToday: false,
  totalDays: 0,
};

function read(): StreakSnapshot {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ready: true,
    current: getCurrentStreak(),
    best: getLongestStreak(),
    activeToday: getActiveDatesThisWeek().includes(today),
    totalDays: getTotalActiveDays(),
  };
}

/**
 * The one streak every screen shows — the sidebar, the header, the
 * profile's stat card and week strip, the stats page. All of it comes from
 * `daily-streak` (the days a student actually did something), so the
 * numbers can't disagree; the profile mock's fixed `currentStreak` is no
 * longer read anywhere.
 */
export function useStreak(): StreakSnapshot {
  const [snapshot, setSnapshot] = useState<StreakSnapshot>(EMPTY);

  useEffect(() => {
    const refresh = () => setSnapshot(read());
    refresh();
    window.addEventListener(STREAK_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(STREAK_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return snapshot;
}
