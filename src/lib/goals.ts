import type { DailyGoal } from "./profile";

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

  return data.goals.map((goal, idx) => ({
    id: `ai-goal-${idx + 1}`,
    text: goal.text,
    type: goal.type,
    done: false,
  }));
}
