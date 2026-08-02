import type { PreviewMode } from "@/contexts/PreviewModeContext";

export const LAYOUT_SPRING = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export type DashboardGridVariant = "tools" | "subjects" | "library" | "metrics";

const MOCK_GRID: Record<DashboardGridVariant, string> = {
  tools: "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3",
  subjects: "grid grid-cols-1 gap-6 md:grid-cols-3",
  library: "grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4",
  metrics: "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4",
};

const LIVE_GRID: Record<DashboardGridVariant, string> = {
  tools: "grid grid-cols-1 gap-4",
  subjects: "grid grid-cols-1 gap-4",
  library: "grid grid-cols-1 gap-4",
  metrics: "grid grid-cols-1 gap-4",
};

export function getWorkspaceGridClass(
  mode: PreviewMode,
  variant: DashboardGridVariant,
): string {
  return mode === "mock" ? MOCK_GRID[variant] : LIVE_GRID[variant];
}

export function isLivePreviewMode(mode: PreviewMode): boolean {
  return mode === "live";
}

export function getToolCardClass(mode: PreviewMode): string {
  return isLivePreviewMode(mode)
    ? "flex min-h-[92px] flex-row items-center gap-4 p-4 sm:min-h-[100px] sm:p-5"
    : "flex min-h-[168px] flex-col justify-between p-6";
}

export function getSubjectCardClass(mode: PreviewMode): string {
  return isLivePreviewMode(mode)
    ? "flex min-h-[88px] flex-row items-center gap-4 p-4 sm:p-5"
    : "p-6";
}

export function getLibraryCardClass(mode: PreviewMode): string {
  return isLivePreviewMode(mode)
    ? "flex min-h-[88px] flex-row items-center gap-4 p-4"
    : "flex flex-col justify-between p-4";
}
