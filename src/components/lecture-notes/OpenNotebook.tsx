"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { JOURNAL_SECTIONS, type JournalSection } from "@/lib/lecture-notes";
import { BinderClip } from "./BinderClip";

interface OpenNotebookProps {
  section: JournalSection;
  onSectionChange: (section: JournalSection) => void;
  flipKey: string;
  flipDirection: number;
  onNewNote: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  canPrev: boolean;
  canNext: boolean;
  leftHeaderLeft: string;
  leftHeaderRight: string;
  rightHeaderLeft: string;
  rightHeaderRight: string;
  leftPage: ReactNode;
  rightPage: ReactNode;
}

export function OpenNotebook({
  section,
  onSectionChange,
  flipKey,
  flipDirection,
  onNewNote,
  onPrevPage,
  onNextPage,
  canPrev,
  canNext,
  leftHeaderLeft,
  leftHeaderRight,
  rightHeaderLeft,
  rightHeaderRight,
  leftPage,
  rightPage,
}: OpenNotebookProps) {
  return (
    <div className="relative mx-auto w-full max-w-[1080px] px-6 pb-6 pt-4 sm:px-10 sm:pb-10">
      <div className="relative pr-8 sm:pr-10">
        <button
          type="button"
          onClick={onNewNote}
          className="absolute left-0 top-8 z-20 inline-flex h-12 -translate-x-[70%] items-center rounded-l-md bg-lime-400 px-2 text-[10px] font-black uppercase tracking-wide text-lime-950 shadow-[0_6px_14px_rgba(132,204,22,0.35)] transition hover:bg-lime-300"
          style={{ writingMode: "vertical-rl" }}
        >
          <Plus className="mb-1 h-3.5 w-3.5" />
          ახალი
        </button>

        <div className="pointer-events-none absolute left-0 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg]">
          <BinderClip className="h-[72px] w-[54px] sm:h-20 sm:w-14" />
        </div>
        <div className="pointer-events-none absolute right-8 top-1/2 z-30 translate-x-1/2 -translate-y-1/2 rotate-[8deg] sm:right-10">
          <BinderClip className="h-[72px] w-[54px] sm:h-20 sm:w-14" />
        </div>

        <div className="absolute right-0 top-24 z-0 flex flex-col gap-1.5">
          {JOURNAL_SECTIONS.map((tab) => {
            const active = tab.id === section;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSectionChange(tab.id)}
                className="rounded-r-xl px-2 py-3 text-[10px] font-black uppercase tracking-wide transition sm:px-2.5 sm:text-[11px]"
                style={{
                  writingMode: "vertical-rl",
                  backgroundColor: tab.tabColor,
                  color: tab.tabInk,
                  transform: active ? "translateX(4px)" : "translateX(14px)",
                  boxShadow: active
                    ? "4px 6px 0 rgba(80,0,40,0.16)"
                    : "2px 3px 0 rgba(80,0,40,0.1)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className="relative z-10 overflow-hidden rounded-l-[36px] rounded-r-[36px] bg-[#FBF7F0] shadow-[0_28px_70px_rgba(80,0,30,0.38),0_8px_18px_rgba(0,0,0,0.18)] sm:rounded-l-[48px] sm:rounded-r-[48px]"
          style={{ perspective: 1600 }}
        >
          <AnimatePresence mode="wait" custom={flipDirection}>
            <motion.div
              key={flipKey}
              custom={flipDirection}
              initial="enter"
              animate="center"
              exit="exit"
              variants={{
                enter: (dir: number) => ({
                  rotateY: dir >= 0 ? -78 : 78,
                  opacity: 0.35,
                }),
                center: { rotateY: 0, opacity: 1 },
                exit: (dir: number) => ({
                  rotateY: dir >= 0 ? 78 : -78,
                  opacity: 0.35,
                }),
              }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "center center", transformStyle: "preserve-3d" }}
              className="relative grid min-h-[560px] grid-cols-1 sm:min-h-[640px] lg:grid-cols-2"
            >
              <div className="pointer-events-none absolute inset-y-6 left-1/2 z-20 hidden w-px -translate-x-1/2 bg-[#d4b8a8] lg:block" />
              <article className="relative flex flex-col border-b border-[#eadfd0] bg-[#FFFDF8] px-5 pb-6 pt-10 sm:px-8 lg:rounded-l-[48px] lg:border-b-0 lg:border-r lg:border-[#eadfd0]">
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 hidden w-10 lg:block"
                  style={{
                    background:
                      "linear-gradient(to left, rgba(80,50,30,0.12), rgba(80,50,30,0.03) 40%, transparent)",
                  }}
                />
                <div className="mb-3 flex items-end justify-between gap-3 border-b border-[#E8A0B8] pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                  <span className="truncate">{leftHeaderLeft}</span>
                  <span className="shrink-0">{leftHeaderRight}</span>
                </div>
                {leftPage}
              </article>

              <article className="relative flex flex-col bg-[#FFFDF8] px-5 pb-6 pt-10 sm:px-8 lg:rounded-r-[48px]">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 hidden w-10 lg:block"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(80,50,30,0.12), rgba(80,50,30,0.03) 40%, transparent)",
                  }}
                />
                <div className="mb-3 flex items-end justify-between gap-3 border-b border-[#E8A0B8] pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                  <span className="truncate">{rightHeaderLeft}</span>
                  <span className="shrink-0">{rightHeaderRight}</span>
                </div>
                {rightPage}
              </article>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPrevPage}
          disabled={!canPrev}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 disabled:opacity-30"
          aria-label="წინა გვერდი"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onNextPage}
          disabled={!canNext}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 disabled:opacity-30"
          aria-label="შემდეგი გვერდი"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
