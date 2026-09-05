"use client";

import { useEffect, useState } from "react";
import {
  computeDashboardMetrics,
  DASHBOARD_METRICS_UPDATED_EVENT,
  getRecentActivity,
  type ActivityEntry,
  type DashboardMetrics,
} from "@/lib/dashboard-metrics";
import { STREAK_UPDATED_EVENT } from "@/lib/daily-streak";

interface DashboardMetricsState {
  metrics: DashboardMetrics | null;
  activity: ActivityEntry[] | null;
}

/** Live, per-user dashboard stats + recent activity. Fields are `null`
 * until the first client render so server markup and hydration stay in
 * sync (and we never flash invented numbers). */
export function useDashboardMetrics(): DashboardMetricsState {
  const [state, setState] = useState<DashboardMetricsState>({
    metrics: null,
    activity: null,
  });

  useEffect(() => {
    const refresh = () =>
      setState({ metrics: computeDashboardMetrics(), activity: getRecentActivity() });
    refresh();
    window.addEventListener(DASHBOARD_METRICS_UPDATED_EVENT, refresh);
    window.addEventListener(STREAK_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(DASHBOARD_METRICS_UPDATED_EVENT, refresh);
      window.removeEventListener(STREAK_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return state;
}
