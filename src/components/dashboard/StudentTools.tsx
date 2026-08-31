"use client";

import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  CalendarClock,
  ChevronRight,
  FileSearch,
  ListChecks,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { researchPlatformHref } from "@/lib/space-back-navigation";
import { STUDENT_TOOL_ACCENTS } from "@/lib/abiturient-neon-accents";
import { DashboardGlowCard } from "@/components/abiturient/DashboardGlowCard";
import type { NeonSubjectAccent } from "@/lib/abiturient-neon-accents";
import { usePreviewMode } from "@/contexts/PreviewModeContext";
import {
  DashboardMorphGrid,
  DashboardMorphItem,
} from "@/components/dashboard/DashboardMorphGrid";
import { getToolCardClass, isLivePreviewMode } from "@/lib/dashboard-preview-layout";

const TOOLS = [
  {
    id: "study-plan",
    title: "სასწავლო გეგმა",
    description: "AI-ით გენ. გეგმები Calendar View-ით",
    href: "/study-plan",
    icon: CalendarClock,
    accent: STUDENT_TOOL_ACCENTS.studyPlan,
  },
  {
    id: "quiz",
    title: "ინტერაქციული ვიქტორინა",
    description: "კითხვები კონსპექტიდან და ტექსტიდან",
    href: "/quiz",
    icon: Brain,
    accent: STUDENT_TOOL_ACCENTS.quiz,
  },
  {
    id: "ai-teacher",
    title: "AI მასწავლებელი",
    description: "ინტერაქტიური ჩატი თემით და კონსპექტით",
    href: "/ai-teacher",
    icon: MessageSquareText,
    accent: STUDENT_TOOL_ACCENTS.aiTeacher,
  },
  {
    id: "presentation",
    title: "AI პრეზენტაცია",
    description: "4-step wizard, templates, PPTX/PDF",
    href: "/presentation",
    icon: Sparkles,
    accent: STUDENT_TOOL_ACCENTS.presentation,
  },
  {
    id: "research",
    title: "მასალა → ანალიზი",
    description: "PDF, ფოტო, ტექსტი, აუდიო — ერთად გაანალიზე",
    href: researchPlatformHref("student"),
    icon: FileSearch,
    accent: STUDENT_TOOL_ACCENTS.research,
  },
  {
    id: "eli5",
    title: "ELI5 ახსნა",
    description: "რთული კონცეფციები — მარტივ ენაზე",
    href: "/eli5",
    icon: ListChecks,
    accent: STUDENT_TOOL_ACCENTS.eli5,
  },
] as const;

function ToolIconWrap({
  accent,
  children,
  compact,
}: {
  accent: NeonSubjectAccent;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`subject-icon-wrap inline-flex shrink-0 items-center justify-center transition-all duration-300 ease-in-out group-hover:shadow-[0_0_12px_var(--accent-color-glow)] ${compact ? "h-10 w-10" : "h-11 w-11"}`}
      style={{ borderColor: `${accent.accent}44` }}
    >
      {children}
    </div>
  );
}

interface OpeningTool {
  href: string;
  accent: NeonSubjectAccent;
  icon: (typeof TOOLS)[number]["icon"];
  title: string;
  x: number;
  y: number;
}

export function StudentTools() {
  const { previewMode } = usePreviewMode();
  const isLive = isLivePreviewMode(previewMode);
  const cardClass = getToolCardClass(previewMode);
  const router = useRouter();
  const [opening, setOpening] = useState<OpeningTool | null>(null);

  const handleMobileOpen = (
    event: MouseEvent,
    tool: (typeof TOOLS)[number],
  ) => {
    if (typeof window === "undefined" || window.innerWidth >= 640) return;
    event.preventDefault();
    if (opening) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setOpening({
      href: tool.href,
      accent: tool.accent,
      icon: tool.icon,
      title: tool.title,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    window.setTimeout(() => {
      router.push(tool.href);
    }, 480);
  };

  return (
    <>
    <DashboardMorphGrid variant="tools" className="mobile-stack-tools">
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        return (
          <DashboardMorphItem
            key={tool.id}
            id={`student-tool-${tool.id}`}
            className="mobile-stack-tool-item"
          >
            <DashboardGlowCard
              accent={tool.accent}
              href={tool.href}
              layoutId={`student-tool-card-${tool.id}`}
              className={`${cardClass} mobile-vivid-tool-card`}
              onClick={(event) => handleMobileOpen(event, tool)}
            >
              {isLive ? (
                <>
                  <ToolIconWrap accent={tool.accent} compact>
                    <Icon className={`h-5 w-5 ${tool.accent.iconClass}`} strokeWidth={1.5} />
                  </ToolIconWrap>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {tool.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-600 dark:text-white/70">
                      {tool.description}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 transition-all duration-300 ease-in-out group-hover:text-[color:var(--accent-color)] dark:text-zinc-400">
                    გახსნა
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </>
              ) : (
                <>
                  <div>
                    <ToolIconWrap accent={tool.accent}>
                      <Icon className={`h-5 w-5 ${tool.accent.iconClass}`} strokeWidth={1.5} />
                    </ToolIconWrap>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                      {tool.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-white/70">
                      {tool.description}
                    </p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-all duration-300 ease-in-out group-hover:text-[color:var(--accent-color)] dark:text-zinc-400 dark:group-hover:text-white">
                    გახსნა
                    <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                  </span>
                </>
              )}
            </DashboardGlowCard>
          </DashboardMorphItem>
        );
      })}
    </DashboardMorphGrid>

    <AnimatePresence>
      {opening && (
        <motion.div
          className="fixed inset-0 z-[95] flex flex-col items-center justify-center gap-4"
          style={{ background: opening.accent.accent }}
          initial={{ clipPath: `circle(0px at ${opening.x}px ${opening.y}px)` }}
          animate={{ clipPath: `circle(150% at ${opening.x}px ${opening.y}px)` }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.48, ease: [0.65, 0, 0.35, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.16, duration: 0.25 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90"
          >
            <opening.icon className="h-7 w-7" style={{ color: opening.accent.accent }} strokeWidth={1.75} />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.25 }}
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
