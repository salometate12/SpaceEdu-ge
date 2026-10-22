import { Suspense } from "react";
import { StudyPlanPlanner } from "@/components/StudyPlan/StudyPlanPlanner";
import "./study-plan-theme.css";

/** The student's study plan generator. The abiturient one is /study-plan/abit. */
export default function StudyPlanPage() {
  return (
    <main>
      {/* `?day=` (from a notification) opens that day. */}
      <Suspense fallback={null}>
        <StudyPlanPlanner />
      </Suspense>
    </main>
  );
}
