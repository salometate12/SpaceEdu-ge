"use client";

import { useCallback, useEffect, useState } from "react";
import type { PremiumAssistantPath } from "@/lib/assistant-routes";
import {
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
