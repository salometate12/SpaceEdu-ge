"use client";

import { useCallback, useEffect, useState } from "react";
import type { PremiumAssistantPath } from "@/lib/assistant-routes";
import {
  ASSISTANT_HISTORY_UPDATED_EVENT,
  appendAssistantHistory,
  loadAssistantHistory,
  type AssistantHistoryEntry,
} from "@/lib/assistant-generation-history";

export function useAssistantGenerationHistory(route: PremiumAssistantPath) {
  const [entries, setEntries] = useState<AssistantHistoryEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEntries(loadAssistantHistory(route));
    setHydrated(true);
    // The account's history arriving from another device.
    const sync = () => setEntries(loadAssistantHistory(route));
    window.addEventListener(ASSISTANT_HISTORY_UPDATED_EVENT, sync);
    return () => window.removeEventListener(ASSISTANT_HISTORY_UPDATED_EVENT, sync);
  }, [route]);

  const addEntry = useCallback(
    (query: string) => {
      setEntries((current) => {
        const next = appendAssistantHistory(route, query, current);
        return next;
      });
    },
    [route],
  );

  return { entries, addEntry, hydrated };
}
