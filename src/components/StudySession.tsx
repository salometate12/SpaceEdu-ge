"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ka } from "@/lib/i18n";
import { markCardLearned } from "@/lib/progress";
import type { Deck, StudySessionResult } from "@/lib/types";
import { FlashcardFlip } from "./FlashcardFlip";
import { Navbar } from "./Navbar";
import { StudyControls } from "./StudyControls";
import { StudyProgress } from "./StudyProgress";
import { SummaryScreen } from "./SummaryScreen";

interface StudySessionProps {
  deck: Deck;
}

export function StudySession({ deck }: StudySessionProps) {
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  const cards = deck.cards;
  const currentCard = cards[cardIndex];
  const total = cards.length;

  const result: StudySessionResult = {
    known,
    unknown,
    total,
  };

  const advance = useCallback(
    (wasKnown: boolean) => {
      if (!currentCard) return;

      if (wasKnown) {
        setKnown((k) => k + 1);
        markCardLearned(deck.id, currentCard.id);
      } else {
        setUnknown((u) => u + 1);
      }

      setIsFlipped(false);

      if (cardIndex + 1 >= total) {
        setIsComplete(true);
      } else {
        setCardIndex((i) => i + 1);
      }
    },
    [cardIndex, currentCard, deck.id, total],
  );

  const handleFlip = useCallback(() => {
    if (!isComplete) setIsFlipped((f) => !f);
  }, [isComplete]);

  const handleRestart = useCallback(() => {
    setCardIndex(0);
    setIsFlipped(false);
    setKnown(0);
    setUnknown(0);
    setIsComplete(false);
    setSessionKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isComplete) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        advance(false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        advance(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advance, handleFlip, isComplete]);

  return (
    <>
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {ka.study.backToDecks}
        </Link>

        {isComplete ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <SummaryScreen
              deckTitle={deck.title}
              result={result}
              onRestart={handleRestart}
            />
          </div>
        ) : (
          <div
            key={sessionKey}
            className="flex flex-1 flex-col items-center justify-center gap-8 py-4"
          >
            <div className="w-full max-w-xl">
              <h1 className="mb-6 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {deck.title}
              </h1>
              <StudyProgress current={cardIndex + 1} total={total} />
            </div>

            {currentCard && (
              <FlashcardFlip
                card={currentCard}
                isFlipped={isFlipped}
                onFlip={handleFlip}
              />
            )}

            <StudyControls
              onDontKnow={() => advance(false)}
              onKnow={() => advance(true)}
            />

            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
              {ka.study.shortcuts}
            </p>
          </div>
        )}
      </main>
    </>
  );
}
