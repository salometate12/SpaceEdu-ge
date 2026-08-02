"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { usePreviewMode } from "@/contexts/PreviewModeContext";
import {
  getWorkspaceGridClass,
  LAYOUT_SPRING,
  type DashboardGridVariant,
} from "@/lib/dashboard-preview-layout";

interface DashboardMorphGridProps {
  variant: DashboardGridVariant;
  className?: string;
  children: ReactNode;
}

export function DashboardMorphGrid({
  variant,
  className = "",
  children,
}: DashboardMorphGridProps) {
  const { previewMode } = usePreviewMode();

  return (
    <motion.div
      layout
      className={`${getWorkspaceGridClass(previewMode, variant)} ${className}`.trim()}
      transition={LAYOUT_SPRING}
    >
      {children}
    </motion.div>
  );
}

interface DashboardMorphItemProps {
  id: string;
  className?: string;
  children: ReactNode;
}

export function DashboardMorphItem({
  id,
  className = "",
  children,
}: DashboardMorphItemProps) {
  return (
    <motion.div
      layout
      layoutId={id}
      className={className}
      transition={LAYOUT_SPRING}
    >
      {children}
    </motion.div>
  );
}
