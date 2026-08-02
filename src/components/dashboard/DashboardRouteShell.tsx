"use client";

import { useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import type { SmartSpace } from "@/lib/smart-space";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

interface DashboardRouteShellProps {
  space: SpaceeduSpace;
  smartSpace: SmartSpace;
}

export function DashboardRouteShell({ space, smartSpace }: DashboardRouteShellProps) {
  useEffect(() => {
    window.localStorage.setItem("spaceedu_space", space);
    window.localStorage.setItem("spaceedu-active-space", smartSpace);
  }, [space, smartSpace]);

  return <Dashboard initialSpace={smartSpace} />;
}
