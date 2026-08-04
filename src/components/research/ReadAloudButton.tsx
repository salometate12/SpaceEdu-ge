"use client";

import { useEffect, useState } from "react";
import { Pause, Volume2 } from "lucide-react";

type SpeechStatus = "idle" | "speaking" | "paused";

interface ReadAloudButtonProps {
  text: string;
  className?: string;
}

function pickGeorgianVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice) => voice.lang?.toLowerCase().startsWith("ka"));
}

/**
 * Reads the given text aloud via the browser's built-in speech synthesis —
 * no backend/API needed. Georgian voice support varies by device/browser;
 * we ask for a "ka" voice if one is installed and otherwise fall back to
 * whatever default voice the browser picks for the ka-GE language tag.
 *
 * This component only ever renders client-side after an AI result exists
 * (never during initial SSR), so checking `window` directly during render
 * is safe — no hydration mismatch risk. The parent should pass a `key`
 * derived from `text` so switching tabs/analyses remounts this component
 * (cancelling any in-flight speech and resetting to "idle") instead of us
 * needing an extra effect+setState just to react to prop changes.
 */
export function ReadAloudButton({ text, className = "" }: ReadAloudButtonProps) {
  const [status, setStatus] = useState<SpeechStatus>("idle");

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const supportsSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
  if (!supportsSpeech) return null;

  const handleClick = () => {
    if (!text.trim()) return;

    if (status === "speaking") {
      window.speechSynthesis.pause();
      setStatus("paused");
      return;
    }

    if (status === "paused") {
      window.speechSynthesis.resume();
      setStatus("speaking");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ka-GE";
    const georgianVoice = pickGeorgianVoice();
    if (georgianVoice) utterance.voice = georgianVoice;
    utterance.rate = 0.98;
    utterance.onend = () => setStatus("idle");
    utterance.onerror = () => setStatus("idle");
    window.speechSynthesis.speak(utterance);
    setStatus("speaking");
  };

  const Icon = status === "speaking" ? Pause : Volume2;
  const label =
    status === "speaking" ? "შეჩერება" : status === "paused" ? "გაგრძელება" : "მოსმენა";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!text.trim()}
      aria-pressed={status === "speaking"}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${
        status === "speaking"
          ? "border-violet-400/60 bg-violet-100 text-violet-700 dark:border-purple-400/50 dark:bg-purple-500/15 dark:text-purple-200"
          : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-zinc-400 dark:hover:text-white"
      } ${className}`}
    >
      <Icon
        className={`h-3.5 w-3.5 ${status === "speaking" ? "animate-pulse" : ""}`}
        strokeWidth={2}
      />
      {label}
    </button>
  );
}
