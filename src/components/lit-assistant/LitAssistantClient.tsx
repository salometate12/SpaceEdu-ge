"use client";

import { BookOpen } from "lucide-react";
import { litAssistantUi } from "@/lib/lit-assistant-ui";
import { PremiumStreamAssistant } from "@/components/assistants/PremiumStreamAssistant";

export function LitAssistantClient() {
  return (
    <PremiumStreamAssistant
      route="/lit-assistant"
      ui={{
        pageTitle: litAssistantUi.pageTitle,
        pageSubtitle: litAssistantUi.pageSubtitle,
        emptyHint: litAssistantUi.emptyHint,
        searchPlaceholder: litAssistantUi.searchPlaceholder,
        submitButton: litAssistantUi.searchButton,
        searching: litAssistantUi.searching,
        writing: litAssistantUi.writing,
        stop: litAssistantUi.stop,
        resetLabel: litAssistantUi.newSearch,
        error: litAssistantUi.error,
      }}
      apiPath="/api/lit-assistant"
      bodyKey="topic"
      accent="violet"
      downloadPrefix="ლიტერატურა-კონსპექტი"
      withSources
      emptyIcon={<BookOpen className="h-8 w-8 stroke-[1.5] text-purple-500/80" />}
    />
  );
}
