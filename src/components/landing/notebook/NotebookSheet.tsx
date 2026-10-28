import type { ReactNode } from "react";

/**
 * One ruled notebook sheet on the landing: white (dark in night mode) paper
 * with rules and a pink margin line (`.landing-paper` in landing.css). Only
 * the hero and the prices sit on one; the other sections are plain cards
 * on the page.
 */
export function NotebookSheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`landing-paper relative overflow-hidden ${className}`}>{children}</div>;
}
