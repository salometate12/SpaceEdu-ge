"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { continueItems, materialHref, type MaterialItem } from "@/lib/library/materials";
import { SourceTile } from "./MaterialCard";
import { useMaterials } from "./useMaterials";
import "./library.css";

function line(item: MaterialItem): string {
  if (item.deck) {
    return item.deck.started
      ? `ვიცი ${item.deck.known} · გასამეორებელი ${item.deck.unknown}`
      : `${item.deck.cards} ბარათი`;
  }
  if (item.quiz) {
    return item.quiz.finished
      ? `${item.quiz.correct} / ${item.quiz.questions} სწორი`
      : item.quiz.answered > 0
        ? `${item.quiz.answered} / ${item.quiz.questions} კითხვა`
        : `${item.quiz.questions} კითხვა`;
  }
  return "კონსპექტი";
}

/**
 * The dashboard's „გააგრძელე, სადაც გაჩერდი“: up to three unfinished decks
 * or quizzes, else the three made last. Not shown while there's nothing.
 */
export function ContinueCard() {
  const { decks, quizzes, conspectus } = useMaterials();
  const items = useMemo(() => continueItems([...decks, ...quizzes, ...conspectus]), [decks, quizzes, conspectus]);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="continue-title" className="lib lib-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="continue-title" className="text-[17px] font-bold text-[var(--lib-title)]">
          გააგრძელე, სადაც გაჩერდი
        </h2>
        <Link href="/library" className="lib-focus inline-flex shrink-0 items-center gap-1 rounded-full text-[14px] font-semibold text-[var(--lib-pink)] hover:underline">
          ჩემი მასალები
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <ul className="mt-3 flex flex-col">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={materialHref(item)}
              className="lib-focus -mx-2 flex h-[60px] items-center gap-3 rounded-[14px] px-2 hover:bg-[var(--lib-hover)]"
            >
              <SourceTile item={item} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-[var(--lib-title)]">{item.title}</span>
                <span className="block truncate text-[13px] text-[var(--lib-muted)]">{line(item)}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[var(--lib-muted)]" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
