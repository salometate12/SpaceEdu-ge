import { goalCategory } from "./goals-card";
import type { DailyGoal } from "./profile";
import { localToday } from "./study-plan-board";

export async function generateDailyGoals({
  studyPlan,
  weakSubjects,
}: {
  studyPlan: string;
  weakSubjects: string;
}): Promise<DailyGoal[]> {
  const today = new Date().toLocaleDateString("ka-GE");
  const prompt = `
მომხმარებლის სასწავლო გეგმის მიხედვით შექმენი დღევანდელი 5 მიზანი:
${studyPlan}

დღეს: ${today}
სუსტი საგნები: ${weakSubjects}

დააბრუნე JSON:
{
  "goals": [
    { "text": "მიზნის ტექსტი", "type": "quiz|study|read|chat" }
  ]
}
მხოლოდ JSON, ქართულ ენაზე.
`;

  const response = await fetch("/api/profile-goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = (await response.json()) as
    | { goals: Array<{ text: string; type: "quiz" | "study" | "read" | "chat" }> }
    | { error?: boolean; message?: string };

  if (!response.ok || ("error" in data && data.error)) {
    throw new Error(
      ("message" in data && data.message) ||
        "AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.",
    );
  }

  if (!("goals" in data)) {
    throw new Error("AI ამჟამად მიუწვდომელია. სცადე კიდევ ერთხელ.");
  }

  const day = localToday();
  return data.goals.map((goal) => ({
    id: crypto.randomUUID(),
    text: goal.text,
    type: goalCategory(goal.type),
    done: false,
    date: day,
  }));
}
