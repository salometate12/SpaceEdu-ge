import type { DeckCategory } from "@/lib/types";

/** AI ასისტენტის გვერდი კატეგორიის მიხედვით (მხოლოდ სადაც არსებობს). */
export const DECK_CATEGORY_ASSISTANT_HREF: Partial<
  Record<Exclude<DeckCategory, "all">, string>
> = {
  history: "/history-assistant",
  georgian: "/lit-assistant",
  civic: "/civics-assistant",
};

export function getAssistantHrefForDeckCategory(
  category: Exclude<DeckCategory, "all">,
): string | undefined {
  return DECK_CATEGORY_ASSISTANT_HREF[category];
}

/** პირველი ასისტენტის გვერდი რეჟიმის გადართვისთვის. */
export const DEFAULT_ASSISTANT_HREF = "/lit-assistant";
