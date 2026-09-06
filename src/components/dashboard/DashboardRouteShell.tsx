"use client";

import { useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { CALENDAR_UPDATED_EVENT } from "@/lib/syllabus-calendar";
import type { SmartSpace } from "@/lib/smart-space";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

interface DashboardRouteShellProps {
  space: SpaceeduSpace;
  smartSpace: SmartSpace;
}

export function DashboardRouteShell({ space, smartSpace }: DashboardRouteShellProps) {
  useEffect(() => {
    const changed = window.localStorage.getItem("spaceedu_space") !== space;
    window.localStorage.setItem("spaceedu_space", space);
    window.localStorage.setItem("spaceedu-active-space", smartSpace);
    // The dashboard calendar key is derived from spaceedu_space; nudge any
    // mounted calendar panel to re-read now that it's correct for this route.
    if (changed) window.dispatchEvent(new Event(CALENDAR_UPDATED_EVENT));
  }, [space, smartSpace]);

  return <Dashboard initialSpace={smartSpace} />;
}
