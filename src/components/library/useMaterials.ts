"use client";

import { useEffect, useState } from "react";
import { CONSPECTUS_UPDATED_EVENT, getConspectusList } from "@/lib/conspectus-storage";
import { CUSTOM_DECKS_UPDATED_EVENT, getCustomDecks } from "@/lib/custom-decks";
import { loadSession } from "@/lib/flashcard-session";
import { getAttempts, getQuizzes, QUIZZES_UPDATED_EVENT } from "@/lib/quiz-library";
import { userStore } from "@/lib/user-data";
import { FLASHCARD_SESSIONS_KEY } from "@/lib/user-data-keys";
import { getTaskHelpers, TASK_HELPERS_UPDATED_EVENT } from "@/lib/task-helper-store";
import { conspectusItem, deckItem, quizItem, taskItem, type MaterialItem } from "@/lib/library/materials";

export interface Materials {
  decks: MaterialItem[];
  quizzes: MaterialItem[];
  conspectus: MaterialItem[];
  tasks: MaterialItem[];
  /** False until the browser's copy has been read (no flash of the empty state). */
  ready: boolean;
}

function read(): Materials {
  const attempts = getAttempts();
  return {
    decks: getCustomDecks().map((deck) => deckItem(deck, loadSession(deck.id))),
    quizzes: getQuizzes().map((quiz) => quizItem(quiz, attempts)),
    conspectus: getConspectusList().map(conspectusItem),
    tasks: getTaskHelpers().map(taskItem),
    ready: true,
  };
}

const EMPTY: Materials = { decks: [], quizzes: [], conspectus: [], tasks: [], ready: false };

/** Every deck, quiz and conspectus as list items, kept current (this tab, other tabs, the account). */
export function useMaterials(): Materials {
  const [materials, setMaterials] = useState<Materials>(EMPTY);
  useEffect(() => {
    const refresh = () => setMaterials(read());
    void Promise.resolve().then(refresh);
    const events = [CUSTOM_DECKS_UPDATED_EVENT, QUIZZES_UPDATED_EVENT, CONSPECTUS_UPDATED_EVENT, TASK_HELPERS_UPDATED_EVENT];
    events.forEach((name) => window.addEventListener(name, refresh));
    // Another tab: the same keys change in localStorage.
    window.addEventListener("storage", refresh);
    const stopSessions = userStore.subscribe(FLASHCARD_SESSIONS_KEY, refresh);
    return () => {
      events.forEach((name) => window.removeEventListener(name, refresh));
      window.removeEventListener("storage", refresh);
      stopSessions();
    };
  }, []);
  return materials;
}
