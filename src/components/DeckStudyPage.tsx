"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCustomDeckById } from "@/lib/custom-decks";
import { ka } from "@/lib/i18n";
import { getDeckById } from "@/lib/mockData";
import type { Deck } from "@/lib/types";
import { Navbar } from "./Navbar";
import { StudySession } from "./StudySession";

interface DeckStudyPageProps {
  deckId: string;
}

export function DeckStudyPage({ deckId }: DeckStudyPageProps) {
  const [deck, setDeck] = useState<Deck | null | undefined>(undefined);

  useEffect(() => {
    const mock = getDeckById(deckId);
    if (mock) {
      setDeck(mock);
      return;
    }
    const custom = getCustomDeckById(deckId);
    setDeck(custom ?? null);
  }, [deckId]);

  if (deck === undefined) {
    return (
      <>
        <Navbar />
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
        </div>
      </>
    );
  }

  if (!deck) {
    return (
      <>
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 md:text-4xl dark:text-zinc-50">
            {ka.notFound.title}
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            {ka.notFound.message}
          </p>
          <Link
            href="/"
            className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            {ka.notFound.back}
          </Link>
        </div>
      </>
    );
  }

  return <StudySession deck={deck} />;
}
