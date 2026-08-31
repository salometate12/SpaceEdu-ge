"use client";

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

export function StudentTools() {
  const { previewMode } = usePreviewMode();
  const isLive = isLivePreviewMode(previewMode);
  const cardClass = getToolCardClass(previewMode);

  return (
    <DashboardMorphGrid variant="tools">
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        return (
          <DashboardMorphItem key={tool.id} id={`student-tool-${tool.id}`}>
            <DashboardGlowCard
              accent={tool.accent}
              href={tool.href}
              layoutId={`student-tool-card-${tool.id}`}
              className={`${cardClass} mobile-vivid-tool-card`}
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
  );
}
