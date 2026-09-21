"use client";

import { Check, X } from "lucide-react";
import type { EnglishItem, EnglishTask } from "@/data/englishExamsData";
import { EnglishAudioPlayer } from "./EnglishAudioPlayer";

/**
 * Renders one task's context (audio / paragraphs / passage / gapped text) and
 * its numbered items as answer pickers. Shared by the full exam (reveal off)
 * and the Space practice (reveal on). Standalone tasks (1/3/5) use A–D buttons;
 * matching tasks (2/4/6, `task.bank` present) use a dropdown over the shared
 * bank, since it grows to 14 options.
 */
export function EnglishTaskBody({
  task,
  picks,
  onPick,
  reveal = false,
  unlimitedAudio = false,
}: {
  task: EnglishTask;
  picks: Record<string, string>;
  onPick: (itemId: string, label: string) => void;
  reveal?: boolean;
  unlimitedAudio?: boolean;
}) {
  const isMatching = Boolean(task.bank);

  return (
    <div className="space-y-4">
      {task.audioSrc && (
        <EnglishAudioPlayer
          src={task.audioSrc}
          maxPlays={unlimitedAudio ? undefined : task.playsAllowed}
        />
      )}

      {task.paragraphs && (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121214]">
          {task.paragraphs.map((p) => (
            <p key={p.label} className="text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">
              <span className="font-bold text-amber-700 dark:text-amber-300">{p.label}. </span>
              {p.text}
            </p>
          ))}
        </div>
      )}

      {task.passageText && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121214]">
          <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">
            {task.passageText}
          </p>
        </div>
      )}

      {task.sharedText && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121214]">
          <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-200">
            {task.sharedText}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {task.items.map((item) => (
          <EnglishItemRow
            key={item.id}
            item={item}
            picked={picks[item.id]}
            onPick={(label) => onPick(item.id, label)}
            reveal={reveal}
            useSelect={isMatching}
          />
        ))}
      </div>
    </div>
  );
}

function EnglishItemRow({
  item,
  picked,
  onPick,
  reveal,
  useSelect,
}: {
  item: EnglishItem;
  picked?: string;
  onPick: (label: string) => void;
  reveal: boolean;
  useSelect: boolean;
}) {
  const revealed = reveal && picked != null;
  const correct = picked === item.correctLabel;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#121214]">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          {item.number}
        </span>
        {item.prompt && (
          <p className="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">
            {item.prompt}
          </p>
        )}
      </div>

      {useSelect ? (
        <div className="mt-3">
          <select
            value={picked ?? ""}
            onChange={(e) => onPick(e.target.value)}
            disabled={revealed}
            className="w-full rounded-xl border-2 border-slate-300/80 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500/70 disabled:opacity-70 dark:border-white/[0.14] dark:bg-[#0c0b12] dark:text-slate-100"
          >
            <option value="" disabled>
              აირჩიე პასუხი…
            </option>
            {item.options.map((opt) => (
              <option key={opt.label} value={opt.label}>
                {opt.label} — {opt.text}
              </option>
            ))}
          </select>
          {revealed && (
            <p
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${
                correct
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
              }`}
            >
              {correct ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" /> Correct
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5 stroke-[2.5]" /> Correct answer: {item.correctLabel}
                </>
              )}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {item.options.map((opt) => {
            const isCorrect = revealed && opt.label === item.correctLabel;
            const isWrongPick = revealed && opt.label === picked && opt.label !== item.correctLabel;
            const isPicked = !reveal && picked === opt.label;
            return (
              <button
                key={opt.label}
                type="button"
                disabled={revealed}
                onClick={() => onPick(opt.label)}
                className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm transition disabled:cursor-default ${
                  isCorrect
                    ? "border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10"
                    : isWrongPick
                      ? "border-rose-400 bg-rose-50 dark:border-rose-500/50 dark:bg-rose-500/10"
                      : isPicked
                        ? "border-amber-400 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-500/10"
                        : "border-slate-200 hover:border-amber-300 dark:border-white/10 dark:hover:border-amber-400/40"
                }`}
              >
                <span className="shrink-0 font-bold text-slate-500 dark:text-slate-400">{opt.label})</span>
                <span className="min-w-0 flex-1 text-slate-800 dark:text-slate-200">{opt.text}</span>
                {isCorrect && <Check className="ml-auto h-4 w-4 text-emerald-600" />}
                {isWrongPick && <X className="ml-auto h-4 w-4 text-rose-500" />}
              </button>
            );
          })}
        </div>
      )}

      {revealed && item.explanation && (
        <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[12.5px] leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300">
          {item.explanation}
        </p>
      )}
    </div>
  );
}
