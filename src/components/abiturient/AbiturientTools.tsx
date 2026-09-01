"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import {
  DASHBOARD_TOOL_ACCENTS,
  type NeonSubjectAccent,
} from "@/lib/abiturient-neon-accents";
import { DashboardGlowCard } from "./DashboardGlowCard";
import { usePreviewMode } from "@/contexts/PreviewModeContext";
import {
  DashboardMorphGrid,
  DashboardMorphItem,
} from "@/components/dashboard/DashboardMorphGrid";
import { getToolCardClass, isLivePreviewMode } from "@/lib/dashboard-preview-layout";
import { ABITURIENT_TOOLS } from "@/lib/abiturient-tools";
import { recordToolUsage } from "@/lib/activity";

const TOOLS = ABITURIENT_TOOLS.filter((tool) => tool.id !== "abit-conspectus").map((tool) => ({
  ...tool,
  action: "გახსნა",
}));

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
      className={`subject-icon-wrap inline-flex shrink-0 items-center justify-center transition duration-300 group-hover:shadow-[0_0_12px_var(--accent-color-glow)] ${compact ? "h-10 w-10" : "h-11 w-11"}`}
      style={{ borderColor: `${accent.accent}44` }}
    >
      {children}
    </div>
  );
}

function AiConspectusCard({ isLive, cardClass }: { isLive: boolean; cardClass: string }) {
  const accent = DASHBOARD_TOOL_ACCENTS.conspectus;

  return (
    <DashboardGlowCard
      accent={accent}
      href="/lit-assistant"
      layoutId="abit-tool-conspectus"
      className={cardClass}
      onClick={() => recordToolUsage("abit-conspectus", "AI კონსპექტი")}
    >
      {isLive ? (
        <>
          <ToolIconWrap accent={accent} compact>
            <Sparkles className={`h-5 w-5 ${accent.iconClass}`} strokeWidth={1.5} />
          </ToolIconWrap>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white/90">AI კონსპექტი</h3>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-gray-400">
              კონსპექტების გენერაცია საგნის მიხედვით
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-violet-600 dark:text-purple-400">
            გენერაცია
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </>
      ) : (
        <>
          <div>
            <ToolIconWrap accent={accent}>
              <Sparkles className={`h-5 w-5 ${accent.iconClass}`} strokeWidth={1.5} />
            </ToolIconWrap>
            <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white/90">AI კონსპექტი</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-gray-400">
              კონსპექტების გენერაცია საგნის მიხედვით
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 transition group-hover:text-violet-800 dark:text-purple-400 dark:group-hover:text-purple-300">
            გენერაცია
            <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </>
      )}
    </DashboardGlowCard>
  );
}

export function AbiturientTools() {
  const { previewMode } = usePreviewMode();
  const isLive = isLivePreviewMode(previewMode);
  const cardClass = getToolCardClass(previewMode);

  return (
    <section className="dashboard-section p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl dark:text-white">
          სასწავლო ინსტრუმენტები
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
          AI ინსტრუმენტები და საგამოცდო რესურსები ერთ პანელში.
        </p>
      </div>

      <DashboardMorphGrid variant="tools">
        <DashboardMorphItem id="abit-tool-conspectus-wrap">
          <AiConspectusCard isLive={isLive} cardClass={cardClass} />
        </DashboardMorphItem>
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <DashboardMorphItem key={tool.id} id={`abit-tool-${tool.id}-wrap`}>
              <DashboardGlowCard
                accent={tool.accent}
                href={tool.href}
                layoutId={`abit-tool-${tool.id}`}
                className={cardClass}
                onClick={() => recordToolUsage(tool.id, tool.title)}
              >
                {isLive ? (
                  <>
                    <ToolIconWrap accent={tool.accent} compact>
                      <Icon className={`h-5 w-5 ${tool.accent.iconClass}`} strokeWidth={1.5} />
                    </ToolIconWrap>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white/90">
                        {tool.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-slate-600 dark:text-gray-400">
                        {tool.description}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
                      {tool.action}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </>
                ) : (
                  <>
                    <div>
                      <ToolIconWrap accent={tool.accent}>
                        <Icon className={`h-5 w-5 ${tool.accent.iconClass}`} strokeWidth={1.5} />
                      </ToolIconWrap>
                      <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white/90">
                        {tool.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-gray-400">
                        {tool.description}
                      </p>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition group-hover:text-[color:var(--accent-color)] dark:text-zinc-400 dark:group-hover:text-white">
                      {tool.action}
                      <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </>
                )}
              </DashboardGlowCard>
            </DashboardMorphItem>
          );
        })}
      </DashboardMorphGrid>
    </section>
  );
}
