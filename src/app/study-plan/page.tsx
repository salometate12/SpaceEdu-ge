import { StudyPlanPlanner } from "@/components/StudyPlan/StudyPlanPlanner";
import "./study-plan-theme.css";

/** The student's study plan generator. The abiturient one is /study-plan/abit. */
export default function StudyPlanPage() {
  return (
    <main>
      <StudyPlanPlanner />
    </main>
  );
}
