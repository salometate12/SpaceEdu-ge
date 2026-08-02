"use client";

import { Scale } from "lucide-react";
import { civicsAssistantUi } from "@/lib/civics-assistant-ui";
import { PremiumStreamAssistant } from "@/components/assistants/PremiumStreamAssistant";

export function CivicsAssistantClient() {
  return (
    <PremiumStreamAssistant
      route="/civics-assistant"
      ui={{
        pageTitle: civicsAssistantUi.pageTitle,
        pageSubtitle: civicsAssistantUi.pageSubtitle,
        emptyHint: civicsAssistantUi.emptyHint,
        searchPlaceholder: civicsAssistantUi.inputPlaceholder,
        submitButton: civicsAssistantUi.submitButton,
        searching: civicsAssistantUi.preparing,
        writing: civicsAssistantUi.writing,
        stop: civicsAssistantUi.stop,
        resetLabel: civicsAssistantUi.newTopic,
        error: civicsAssistantUi.error,
      }}
      apiPath="/api/civics-assistant"
      bodyKey="topic"
      accent="emerald"
      downloadPrefix="სამოქალაქო-კონსპექტი"
      maxLength={500}
      emptyIcon={<Scale className="h-8 w-8 stroke-[1.5] text-purple-500/80" />}
    />
  );
}
