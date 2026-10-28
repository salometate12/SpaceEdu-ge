"use client";

import { useMemo } from "react";
import { useStreak } from "@/hooks/useStreak";
import type { Badge } from "@/lib/badges";
import type { StatsSpace } from "@/lib/activity-log";
import { computeBadges } from "@/lib/stats/badges";
import { useActivityLog } from "@/components/stats/stats-ui";

/** This space's eight badges, earned from the activity log; null until read on the client. */
export function useBadges(space: StatsSpace): Badge[] | null {
  const log = useActivityLog();
  const streak = useStreak();
  return useMemo(
    () => (log && streak.ready ? computeBadges(log, space, { streakBest: streak.best }) : null),
    [log, space, streak.ready, streak.best],
  );
}
