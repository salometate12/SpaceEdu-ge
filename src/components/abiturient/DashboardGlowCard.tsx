"use client";

import { motion } from "framer-motion";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import Link from "next/link";
import type { NeonSubjectAccent } from "@/lib/abiturient-neon-accents";
import { LAYOUT_SPRING } from "@/lib/dashboard-preview-layout";

export function neonAccentVars(accent: NeonSubjectAccent): CSSProperties {
  return {
    "--accent-color": accent.accent,
    "--accent-color-glow": accent.glow,
  } as CSSProperties;
}

const MOTION_HOVER = {
  y: -6,
  scale: 1.015,
} as const;

const MOTION_TRANSITION = {
  duration: 0.3,
  ease: "easeInOut" as const,
};

function glowCardClasses(
  accent: NeonSubjectAccent,
  interactive: boolean,
  className: string,
): string {
  return [
    "dashboard-glass-card group relative h-full overflow-hidden transition-all duration-300 ease-in-out",
    interactive
      ? "hover:border-[color:var(--accent-color)]/40 dark:hover:border-[color:var(--accent-color)]/50"
      : "cursor-not-allowed opacity-55",
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 before:ease-in-out",
    interactive ? `hover:before:opacity-100 ${accent.gradientBeforeClass}` : "",
    className,
  ].join(" ");
}

interface DashboardGlowCardProps {
  accent: NeonSubjectAccent;
  children: ReactNode;
  href?: string;
  interactive?: boolean;
  className?: string;
  as?: "link" | "article" | "div";
  layoutId?: string;
  onClick?: (event: MouseEvent) => void;
}

function CardMotionShell({
  interactive,
  children,
  className,
  style,
  layoutId,
}: {
  interactive: boolean;
  children: ReactNode;
  className: string;
  style: CSSProperties;
  layoutId?: string;
}) {
  if (!interactive) {
    return (
      <motion.div layout layoutId={layoutId} className={className} style={style} transition={LAYOUT_SPRING}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      layoutId={layoutId}
      className={className}
      style={style}
      whileHover={MOTION_HOVER}
      transition={{
        layout: LAYOUT_SPRING,
        default: MOTION_TRANSITION,
      }}
    >
      {children}
    </motion.div>
  );
}

export function DashboardGlowCard({
  accent,
  children,
  href,
  interactive = true,
  className = "",
  as = "link",
  layoutId,
  onClick,
}: DashboardGlowCardProps) {
  const baseClass = glowCardClasses(accent, interactive, className);
  const style = neonAccentVars(accent);
  const inner = <div className="relative z-[1] h-full">{children}</div>;

  if (as === "article") {
    return (
      <CardMotionShell interactive={interactive} className={baseClass} style={style} layoutId={layoutId}>
        {inner}
      </CardMotionShell>
    );
  }

  if (as === "div" || !interactive || !href) {
    return (
      <CardMotionShell interactive={false} className={baseClass} style={style} layoutId={layoutId}>
        {inner}
      </CardMotionShell>
    );
  }

  if (/^https?:\/\//i.test(href)) {
    return (
      <CardMotionShell interactive={interactive} className={`block ${baseClass}`} style={style} layoutId={layoutId}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full"
          onClick={onClick}
        >
          {inner}
        </a>
      </CardMotionShell>
    );
  }

  return (
    <CardMotionShell interactive={interactive} className={`block h-full ${baseClass}`} style={style} layoutId={layoutId}>
      <Link href={href} className="block h-full" onClick={onClick}>
        {inner}
      </Link>
    </CardMotionShell>
  );
}
