import type { AdminQuizStore, AdminSettings } from "./types";

const now = () => new Date().toISOString();

export function defaultQuizStore(): AdminQuizStore {
  return {
    meta: { updatedAt: now(), count: 1 },
    items: [
      {
        id: "demo-history-recall",
        title: "ისტორია — აქტивური გახსენება",
        subject: "history",
        materialPreview:
          "ძველი საქართველო, კოლხეთი, ბერძნული კოლონიზაცია და ანტიკური პერიოდი.",
        questionCount: 2,
        questions: [
          {
            id: 1,
            questionText: "რომელი ცივილიზაციაა დაკავშირებული კოლხეთთან?",
            options: ["ეგვიპტე", "შუმერი", "ანტიკური საბერძნეთი", "რომი"],
            correctAnswerIndex: 2,
            explanation: "კოლხეთი ანტიკურ საბერძნეთთანაა დაკავშირებული მითოლოგიით და ვაჭრობით.",
          },
          {
            id: 2,
            questionText: "დიაოხი რომელ რეგიონს ეხება?",
            options: ["აღმოსავლეთ საქართველო", "აფხაზეთი", "სამეგრელო", "კახეთი"],
            correctAnswerIndex: 0,
            explanation: "დიაოხი ძველი აღმოსავლეთ საქართველოს ისტორიის ნაწილია.",
          },
        ],
        updatedAt: now(),
      },
    ],
  };
}

export function defaultSettingsStore(): AdminSettings {
  return {
    meta: { updatedAt: now() },
    siteName: "SpaceEdu",
    siteTagline: "ერთიანი საგანმანათლებლო პლატფორმა",
    maintenanceMode: false,
    supportEmail: "support@spaceedu.ge",
    ai: {
      googleGenerativeAiApiKey: "",
      openaiApiKey: "",
      anthropicApiKey: "",
      providerOrder: "gemini,openai,anthropic",
      geminiModel: "",
      openaiModel: "",
      anthropicModel: "",
    },
  };
}
