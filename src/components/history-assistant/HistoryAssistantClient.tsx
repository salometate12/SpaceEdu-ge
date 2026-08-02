"use client";

import { Compass } from "lucide-react";
import { historyAssistantUi } from "@/lib/history-assistant-ui";
import { PremiumStreamAssistant } from "@/components/assistants/PremiumStreamAssistant";

export function HistoryAssistantClient() {
  return (
    <PremiumStreamAssistant
      route="/history-assistant"
      ui={{
        pageTitle: historyAssistantUi.pageTitle,
        pageSubtitle: historyAssistantUi.pageSubtitle,
        emptyHint: historyAssistantUi.emptyHint,
        searchPlaceholder: historyAssistantUi.searchPlaceholder,
        submitButton: historyAssistantUi.searchButton,
        searching: historyAssistantUi.searching,
        writing: historyAssistantUi.writing,
        stop: historyAssistantUi.stop,
        resetLabel: historyAssistantUi.newSearch,
        error: historyAssistantUi.error,
      }}
      apiPath="/api/history-assistant"
      bodyKey="topic"
      accent="amber"
      downloadPrefix="ისტორია-კონსპექტი"
      withSources
      emptyIcon={<Compass className="h-8 w-8 stroke-[1.5] text-purple-500/80" />}
    />
  );
}
