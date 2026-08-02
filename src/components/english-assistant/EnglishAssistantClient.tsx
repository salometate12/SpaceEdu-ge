"use client";

import { Languages } from "lucide-react";
import { englishAssistantUi } from "@/lib/english-assistant-ui";
import { PremiumStreamAssistant } from "@/components/assistants/PremiumStreamAssistant";

export function EnglishAssistantClient() {
  return (
    <PremiumStreamAssistant
      route="/english-assistant"
      ui={{
        pageTitle: englishAssistantUi.pageTitle,
        pageSubtitle: englishAssistantUi.pageSubtitle,
        emptyHint: englishAssistantUi.emptyHint,
        searchPlaceholder: englishAssistantUi.inputPlaceholder,
        submitButton: englishAssistantUi.submitButton,
        searching: englishAssistantUi.analyzing,
        writing: englishAssistantUi.writing,
        stop: englishAssistantUi.stop,
        resetLabel: englishAssistantUi.newRequest,
        error: englishAssistantUi.error,
      }}
      apiPath="/api/english-assistant"
      bodyKey="query"
      accent="sky"
      downloadPrefix="ინგლისური-ანალიზი"
      inputMode="textarea"
      maxLength={8000}
      charCountLabel={englishAssistantUi.charCount}
      emptyIcon={<Languages className="h-8 w-8 stroke-[1.5] text-purple-500/80" />}
    />
  );
}
