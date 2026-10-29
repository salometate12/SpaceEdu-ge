"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { usePreviewMode } from "@/contexts/PreviewModeContext";
import { isLivePreviewMode } from "@/lib/dashboard-preview-layout";
import { STUDENT_TOOLS as TOOLS, type StudentTool } from "@/lib/student-tools";
import { recordToolUsage } from "@/lib/activity";
import "./student-tools.css";

interface OpeningTool {
  href: string;
  color: string;
  icon: StudentTool["icon"];
  title: string;
  x: number;
  y: number;
}

function toolVars(tool: StudentTool): CSSProperties {
  return {
    "--tool-bg": tool.tile.bg,
    "--tool-fg": tool.tile.fg,
    "--tool-dark-bg": tool.tile.darkBg,
    "--tool-dark-fg": tool.tile.darkFg,
  } as CSSProperties;
}

/**
 * The dashboard's tools. Each card is one link. Desktop: three columns,
 * the study plan (and, with seven cards, the last one) spanning two. Phones: the plan
 * as a wide row, the rest as two-column tiles with a small ↗.
 */
export function StudentTools() {
  const { previewMode } = usePreviewMode();
  const isLive = isLivePreviewMode(previewMode);
  const router = useRouter();
  const [opening, setOpening] = useState<OpeningTool | null>(null);

  const handleOpen = (event: MouseEvent, tool: StudentTool) => {
    recordToolUsage(tool.id, tool.title);
    if (typeof window === "undefined" || window.innerWidth >= 640) return;
    event.preventDefault();
    if (opening) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setOpening({
      href: tool.href,
      color: tool.tile.fg,
      icon: tool.icon,
      title: tool.title,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    window.setTimeout(() => {
      router.push(tool.href);
    }, 780);
  };

  return (
    <>
      <div
        data-student-tools
        className={
          isLive
            ? "grid grid-cols-1 gap-4"
            : "grid grid-cols-2 gap-[10px] sm:gap-4 md:grid-cols-3"
        }
      >
        {TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          const lead = index === 0;
          // Seven cards in three columns: the first and the last span two, so no row has a gap.
          const wideLast = index === TOOLS.length - 1 && TOOLS.length % 3 === 1;
          // Phones (two columns under the wide plan): an odd count leaves the last one alone, so it spans the row.
          const wideLastPhone = index === TOOLS.length - 1 && (TOOLS.length - 1) % 2 === 1;

          if (isLive) {
            return (
              <Link
                key={tool.id}
                href={tool.href}
                onClick={(event) => handleOpen(event, tool)}
                style={toolVars(tool)}
                className="student-tool-card min-h-[92px] flex-row items-center gap-4 p-4 sm:min-h-[100px] sm:p-5"
              >
                <span className="student-tool-tile h-10 w-10">
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-slate-900 dark:text-white">{tool.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-slate-600 dark:text-white/70">{tool.description}</span>
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tool.id}
              href={tool.href}
              onClick={(event) => handleOpen(event, tool)}
              style={toolVars(tool)}
              className={`student-tool-card min-w-0 ${
                lead
                  ? "col-span-2 flex-row items-center gap-3 p-4 sm:min-h-[168px] sm:flex-col sm:items-start sm:justify-start sm:gap-0 sm:p-6"
                  : `flex-col gap-3 p-3.5 sm:min-h-[168px] sm:gap-0 sm:p-6 ${wideLast ? "md:col-span-2" : ""} ${wideLastPhone ? "max-md:col-span-2" : ""}`
              }`}
            >
              {lead ? (
                <>
                  <span className="student-tool-tile h-11 w-11">
                    <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 sm:flex-none">
                    <span className="block text-[16px] font-bold leading-snug text-slate-900 sm:mt-4 sm:text-lg sm:font-semibold dark:text-white">
                      {tool.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-slate-500 sm:mt-2 sm:line-clamp-none sm:text-sm sm:text-slate-600 dark:text-white/70">
                      {tool.description}
                    </span>
                  </span>
                  <span className="student-tool-arrow flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:hidden" aria-hidden>
                    <ArrowUpRight className="h-4 w-4 text-slate-700 dark:text-zinc-300" strokeWidth={2} />
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-start justify-between">
                    <span className="student-tool-tile h-10 w-10 sm:h-11 sm:w-11">
                      <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[#a8a29e] sm:hidden" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-bold leading-[1.3] text-slate-900 sm:mt-4 sm:text-lg sm:font-semibold sm:leading-normal dark:text-white">
                      {tool.title}
                    </span>
                    <span className="mt-1 line-clamp-2 text-[12.5px] leading-[1.45] text-slate-500 sm:mt-2 sm:line-clamp-none sm:text-sm sm:leading-normal sm:text-slate-600 dark:text-white/70">
                      {tool.description}
                    </span>
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>

      <AnimatePresence>
        {opening && (
          <motion.div
            className="fixed inset-0 z-[95] flex flex-col items-center justify-center gap-4"
            style={{ background: opening.color }}
            initial={{ clipPath: `circle(0px at ${opening.x}px ${opening.y}px)` }}
            animate={{ clipPath: `circle(150% at ${opening.x}px ${opening.y}px)` }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.78, ease: [0.65, 0, 0.35, 1] }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.35 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90"
            >
              <opening.icon className="h-7 w-7" style={{ color: opening.color }} strokeWidth={1.75} />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className="text-base font-bold text-white"
            >
              {opening.title}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
