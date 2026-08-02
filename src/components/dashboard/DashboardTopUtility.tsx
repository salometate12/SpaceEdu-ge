"use client";

import { PreviewModeDropdown } from "./PreviewModeDropdown";

export function DashboardTopUtility() {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-30 sm:right-8 sm:top-6">
      <div className="pointer-events-auto">
        <PreviewModeDropdown />
      </div>
    </div>
  );
}
