"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Cpu,
  Loader2,
  RefreshCw,
  Sparkles,
  Square,
} from "lucide-react";
import {
  ConspectusViewer,
  type ConspectusAccent,
} from "@/components/conspectus/ConspectusViewer";
import { useSmartSpace } from "@/components/layout/AssistantControlsContext";
import { splitCompletionAndSources, type HistorySource } from "@/lib/history-sources";
import { sanitizeStreamMarkdown } from "@/lib/ai/parse-flashcards-json";
import { SourcesPanel } from "@/components/history-assistant/SourcesPanel";
import type { PremiumAssistantPath } from "@/lib/assistant-routes";
import { useAssistantGenerationHistory } from "@/hooks/useAssistantGenerationHistory";
import {
  buildAssistantJsonBody,
  streamAiText,
} from "@/lib/assistant-stream-client";
import {
  AssistantPremiumSidebar,
  AssistantQuickPills,
} from "./AssistantPremiumSidebar";
import { AssistantBackToTopFab } from "./AssistantBackToTopFab";

export interface PremiumAssistantUi {
  pageTitle: string;
  pageSubtitle?: string;
  emptyHint: string;
  searchPlaceholder: string;
  submitButton: string;
  searching: string;
  writing: string;
  stop: string;
  resetLabel: string;
  error: string;
}

interface PremiumStreamAssistantProps {
  route: PremiumAssistantPath;
  ui: PremiumAssistantUi;
  apiPath: string;
  bodyKey: "topic" | "query";
  accent: ConspectusAccent;
  downloadPrefix: string;
  withSources?: boolean;
  inputMode?: "input" | "textarea";
  maxLength?: number;
  charCountLabel?: string;
  emptyIcon?: ReactNode;
}

function applyStreamChunk(
  raw: string,
  withSources: boolean,
): { content: string; sources: HistorySource[] } {
  if (withSources) {
    return splitCompletionAndSources(raw);
  }
  return { content: sanitizeStreamMarkdown(raw), sources: [] };
}

export function PremiumStreamAssistant({
  route,
  ui,
  apiPath,
  bodyKey,
  accent,
  downloadPrefix,
  withSources = false,
  inputMode = "input",
  maxLength = 500,
  charCountLabel,
  emptyIcon,
}: PremiumStreamAssistantProps) {
  const space = useSmartSpace();
  const spaceRef = useRef(space);
  spaceRef.current = space;

  const abortRef = useRef<AbortController | null>(null);
  const { entries: historyEntries, addEntry } = useAssistantGenerationHistory(route);

  const [value, setValue] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [completion, setCompletion] = useState("");
  const [sources, setSources] = useState<HistorySource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyChunk = useCallback(
    (partial: string) => {
      const next = applyStreamChunk(partial, withSources);
      setCompletion(next.content);
      if (withSources) {
        setSources(next.sources);
      }
    },
    [withSources],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  const runQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || isLoading) return;

      stop();
      const controller = new AbortController();
      abortRef.current = controller;

      setValue(trimmed);
      setActiveQuery(trimmed);
      setHasSubmitted(true);
      setError(null);
      setCompletion("");
      setSources([]);
      setIsLoading(true);
      addEntry(trimmed);

      try {
        const finalText = await streamAiText(
          apiPath,
          buildAssistantJsonBody(bodyKey, trimmed, spaceRef.current),
          {
            signal: controller.signal,
            fallbackError: ui.error,
            onChunk: applyChunk,
          },
        );

        if (controller.signal.aborted) return;

        const finalView = applyStreamChunk(finalText, withSources);
        if (!finalView.content.trim()) {
          throw new Error(ui.error);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : ui.error);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
        abortRef.current = null;
      }
    },
    [apiPath, applyChunk, bodyKey, addEntry, isLoading, stop, ui.error, withSources],
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      void runQuery(value);
    },
    [value, runQuery],
  );

  const handleReset = useCallback(() => {
    stop();
    setCompletion("");
    setSources([]);
    setHasSubmitted(false);
    setValue("");
    setActiveQuery("");
    setError(null);
  }, [stop]);

  const displayContent = completion;

  const liveSources = useMemo(() => {
    if (!withSources) return [];
    return sources;
  }, [sources, withSources]);

  const isSearchingPhase = isLoading && displayContent.length === 0;
  const isWritingPhase = isLoading && displayContent.length > 0;
  const showEmptyCanvas =
    !hasSubmitted && displayContent.length === 0 && !isLoading;
  const showErrorState =
    !isLoading && Boolean(error) && displayContent.length === 0;

  const handleRetry = useCallback(() => {
    if (!activeQuery.trim()) return;
    void runQuery(activeQuery);
  }, [activeQuery, runQuery]);

  const errorPanel = (
    <div className="mx-auto mt-2 flex w-full max-w-xl flex-col items-start gap-3 rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/[0.08] via-[#121214]/70 to-purple-500/[0.05] p-5 text-left shadow-[0_18px_48px_rgba(244,63,94,0.12)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300">
          <AlertCircle className="h-4 w-4 stroke-[1.5]" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-wide text-rose-100">
            დროებითი შეცდომა
          </p>
          <p className="mt-1 text-sm leading-relaxed text-rose-100/80">
            {error}
          </p>
          {activeQuery && (
            <p className="mt-2 text-[11px] uppercase tracking-wider text-rose-300/60">
              თემა · <span className="text-rose-100/80 normal-case">{activeQuery}</span>
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleRetry}
          disabled={!activeQuery.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 px-3.5 py-2 text-xs font-medium text-white shadow-md shadow-rose-500/20 transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5 stroke-[1.5]" />
          ხელახლა გენერაცია
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-white/[0.16] hover:bg-white/[0.08]"
        >
          ახალი თემა
        </button>
      </div>
    </div>
  );

  const defaultEmptyIcon = (
    <Sparkles className="h-8 w-8 animate-pulse stroke-[1.5] text-purple-500/80" />
  );

  const inputField =
    inputMode === "textarea" ? (
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={ui.searchPlaceholder}
        disabled={isLoading}
        maxLength={maxLength}
        rows={3}
        className="min-h-[72px] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={ui.searchPlaceholder}
        disabled={isLoading}
        maxLength={maxLength}
        className="flex-1 bg-transparent px-2 text-sm text-white placeholder-gray-500 focus:outline-none"
      />
    );

  const searchForm = (className?: string) => (
    <form
      onSubmit={handleSubmit}
      className={
        className ??
        "flex w-full max-w-xl items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#121214]/80 p-2 shadow-2xl backdrop-blur-md transition-all focus-within:border-purple-500/40"
      }
    >
      {inputMode === "textarea" ? (
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center gap-2">
            {inputField}
            <button
              type="submit"
              disabled={!value.trim() || isLoading}
              className="flex shrink-0 items-center gap-1.5 self-end rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-medium text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[1.5]" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 stroke-[1.5]" />
              )}
              {ui.submitButton}
            </button>
          </div>
          {charCountLabel && (
            <p className="px-2 text-right text-[11px] text-gray-500">
              {value.length} / {maxLength} {charCountLabel}
            </p>
          )}
        </div>
      ) : (
        <>
          {inputField}
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-medium text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[1.5]" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 stroke-[1.5]" />
            )}
            {ui.submitButton}
          </button>
        </>
      )}
    </form>
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <AssistantBackToTopFab />
      <div className="flex max-h-[min(52dvh,22rem)] min-h-0 shrink-0 flex-col overflow-hidden lg:max-h-none lg:h-full lg:max-w-none">
        <AssistantPremiumSidebar
          historyEntries={historyEntries}
          onHistorySelect={(query) => void runQuery(query)}
          onPillSelect={(query) => void runQuery(query)}
          pillsDisabled={isLoading}
        />
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#09090b]">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/5 blur-[120px]"
          aria-hidden
        />

        {showEmptyCanvas ? (
          <div className="relative z-[1] flex flex-1 flex-col items-center justify-center p-8">
            <div className="mb-4 rounded-2xl border border-purple-500/10 bg-purple-500/5 p-4">
              {emptyIcon ?? defaultEmptyIcon}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">{ui.pageTitle}</h1>
            <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-gray-400">
              {ui.emptyHint}
            </p>
            <div className="mt-6 flex w-full flex-col items-center justify-center">
              {searchForm()}
              <AssistantQuickPills
                route={route}
                onPillSelect={(query) => void runQuery(query)}
                disabled={isLoading}
              />
            </div>
          </div>
        ) : showErrorState ? (
          <div className="relative z-[1] flex flex-1 flex-col items-center justify-center p-6 lg:p-10">
            <div className="w-full max-w-xl">{errorPanel}</div>
            <div className="mt-6 w-full max-w-xl">{searchForm()}</div>
          </div>
        ) : (
          <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
            {(isSearchingPhase || (error && displayContent.length > 0)) && (
              <div className="shrink-0 space-y-2 border-b border-white/[0.06] px-4 py-3 lg:px-6">
                {isSearchingPhase && (
                  <div className="flex items-center gap-2 text-xs text-purple-300">
                    <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[1.5]" />
                    {ui.searching}
                    {activeQuery && (
                      <span className="truncate text-gray-500">— {activeQuery}</span>
                    )}
                  </div>
                )}
                {error && displayContent.length > 0 && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-xs text-rose-200">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-[1.5]" />
                    <p className="leading-relaxed">{error}</p>
                  </div>
                )}
              </div>
            )}

            <div className="min-h-0 flex-1">
              <ConspectusViewer
                content={displayContent}
                premiumScrollRoot
                isLoading={isSearchingPhase}
                loadingBanner={
                  isWritingPhase ? (
                    <div className="flex shrink-0 items-center gap-2 border-b border-purple-500/20 bg-purple-950/20 px-4 py-2 text-xs font-medium text-purple-200 lg:px-8">
                      <Cpu className="h-3.5 w-3.5 animate-pulse stroke-[1.5]" />
                      {ui.writing}
                    </div>
                  ) : undefined
                }
                showCursor={isWritingPhase}
                downloadFilename={activeQuery.slice(0, 40) || downloadPrefix}
                accent={accent}
                toolbarExtra={
                  <div className="flex flex-wrap items-center gap-2">
                    {withSources && liveSources.length > 0 && (
                      <SourcesPanel sources={liveSources} />
                    )}
                    {isLoading && (
                      <button
                        type="button"
                        onClick={stop}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs text-gray-300 hover:bg-white/[0.06]"
                      >
                        <Square className="h-3 w-3 stroke-[1.5]" />
                        {ui.stop}
                      </button>
                    )}
                    {!isLoading && hasSubmitted && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs font-medium text-purple-400 hover:text-purple-300"
                      >
                        {ui.resetLabel}
                      </button>
                    )}
                  </div>
                }
              />
            </div>

            <div className="shrink-0 border-t border-white/[0.06] p-4 lg:px-8">
              <div className="mx-auto max-w-xl">{searchForm()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
