import { Suspense } from "react";
import { TaskHelperApp } from "@/components/task-helper/TaskHelperApp";

/** „დავალების დამხმარე“: the input, or a saved assignment's plan with `?id=`. */
export default function TaskHelperPage() {
  return (
    <Suspense fallback={null}>
      <TaskHelperApp />
    </Suspense>
  );
}
