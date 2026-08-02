"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Loader2, Search, Square } from "lucide-react";
import {
  ConspectusViewer,
  type ConspectusAccent,
} from "@/components/conspectus/ConspectusViewer";
import {
  useAssistantControls,
  useSmartSpace,
} from "@/components/layout/AssistantControlsContext";

type InputMode = "input" | "textarea";

interface StreamTopicAssistantUi {
  pageTitle: string;
  pageSubtitle: string;
  inputPlaceholder: string;
  submitButton: string;
  loadingLabel: string;
  writing: string;
  emptyHint: string;
  stop: string;
  resetLabel: string;
  error: string;
  examples?: readonly string[];
  charCount?: string;
  maxLength?: number;
}

interface StreamTopicAssistantProps {
  ui: StreamTopicAssistantUi;
  apiPath: string;
  bodyKey: string;
  accent: ConspectusAccent;
  icon: ReactNode;
  iconBgClass: string;
  inputMode?: InputMode;
  focusRingClass: string;
  submitButtonClass: string;
  exampleChipHoverClass: string;
  loadingBannerClass: string;
  downloadPrefix: string;
  emptyEmoji: string;
}

export function StreamTopicAssistant({
  ui,
  apiPath,
  bodyKey,
  accent,
  icon,
  iconBgClass,
  inputMode = "input",
  focusRingClass,
  submitButtonClass,
  exampleChipHoverClass,
  loadingBannerClass,
  downloadPrefix,
  emptyEmoji,
}: StreamTopicAssistantProps) {
  const space = useSmartSpace();
  const spaceRef = useRef(space);
  spaceRef.current = space;
  const [value, setValue] = useState("");
  const valueRef = useRef("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const maxLength = ui.maxLength ?? 500;

  const { completion, complete, isLoading, error, stop, setCompletion } =
    useCompletion({
      api: apiPath,
      streamProtocol: "text",
      experimental_throttle: 32,
      fetch: async (url, init) => {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            [bodyKey]: valueRef.current,
            space: spaceRef.current,
          }),
          signal: init?.signal,
        });

        if (!response.ok) {
          const text = await response.text();
          try {
            const json = JSON.parse(text) as { error?: string };
            throw new Error(json.error || ui.error);
          } catch (e) {
            if (e instanceof SyntaxError) {
              throw new Error(text || ui.error);
            }
            throw e;
          }
        }

        return response;
      },
    });

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || isLoading) return;

      valueRef.current = trimmed;
      setHasSubmitted(true);
      setCompletion("");
      void complete(trimmed);
    },
    [value, isLoading, complete, setCompletion],
  );

  const handleReset = useCallback(() => {
    stop();
    setCompletion("");
    setHasSubmitted(false);
    setValue("");
  }, [stop, setCompletion]);

  const isPreparing = isLoading && completion.length === 0;
  const isWriting = isLoading && completion.length > 0;

  const inputProps = {
    value,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => setValue(e.target.value),
    placeholder: ui.inputPlaceholder,
    disabled: isLoading,
    maxLength,
    className: `w-full rounded-xl border border-zinc-200/80 bg-white text-sm outline-none transition-colors disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 ${focusRingClass}`,
  };

  const controls = useMemo(
    () => (
      <div className="flex min-h-full flex-col gap-4">
        <div className="assistant-controls-heading">
          <div
            className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${iconBgClass}`}
          >
            {icon}
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {ui.pageTitle}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {ui.pageSubtitle}
          </p>
        </div>

        {isPreparing && (
          <div
            className={`rounded-xl border px-3 py-3 ${loadingBannerClass}`}
            role="status"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <p className="text-xs font-medium">{ui.loadingLabel}</p>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error.message}
          </p>
        )}

        {(hasSubmitted || completion.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {isLoading && (
              <button
                type="button"
                onClick={() => stop()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/80 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
              >
                <Square className="h-3 w-3" />
                {ui.stop}
              </button>
            )}
            {!isLoading && hasSubmitted && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium hover:underline"
              >
                {ui.resetLabel}
              </button>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-auto shrink-0 space-y-3 border-t border-zinc-200/70 pt-4 max-lg:mt-0 max-lg:border-t-0 max-lg:pt-0 dark:border-zinc-800/70"
        >
          {inputMode === "textarea" ? (
            <textarea
              {...inputProps}
              rows={4}
              className={`${inputProps.className} resize-none px-3 py-3 leading-relaxed`}
            />
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                {...inputProps}
                className={`${inputProps.className} py-3 pl-10 pr-3`}
              />
            </div>
          )}

          {ui.charCount && (
            <p className="text-right text-[11px] text-zinc-400">
              {value.length} / {maxLength} {ui.charCount}
            </p>
          )}

          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${submitButtonClass}`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>{inputMode === "textarea" ? "✍️" : "📝"}</span>
            )}
            {ui.submitButton}
          </button>

          {ui.examples && ui.examples.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ui.examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setValue(example)}
                  className={`rounded-full border border-zinc-200/80 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-colors disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 ${exampleChipHoverClass}`}
                >
                  {example}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    ),
    [
      ui,
      icon,
      iconBgClass,
      inputMode,
      focusRingClass,
      submitButtonClass,
      exampleChipHoverClass,
      loadingBannerClass,
      value,
      maxLength,
      isLoading,
      isPreparing,
      error,
      hasSubmitted,
      completion.length,
      handleSubmit,
      handleReset,
      stop,
    ],
  );

  useAssistantControls(controls);

  const emptyState = (
    <div className="max-w-md text-center">
      <p className="text-5xl">{emptyEmoji}</p>
      <h2 className="mt-4 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
        {ui.pageTitle}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {ui.emptyHint}
      </p>
    </div>
  );

  return (
    <ConspectusViewer
      content={completion}
      emptyState={emptyState}
      isLoading={isLoading && !completion}
      loadingBanner={
        isWriting ? (
          <div
            className={`flex shrink-0 items-center gap-2 border-b px-4 py-2 text-xs font-medium lg:px-8 lg:py-2.5 ${loadingBannerClass}`}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {ui.writing}
          </div>
        ) : undefined
      }
      showCursor={isWriting}
      downloadFilename={value.trim().slice(0, 40) || downloadPrefix}
      accent={accent}
    />
  );
}
