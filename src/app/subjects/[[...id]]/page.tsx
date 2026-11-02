import { Suspense } from "react";
import { SubjectsPage } from "@/components/subjects/SubjectsPage";

/** „ჩემი საგნები“: /subjects opens the subject seen last, /subjects/<id> that one. */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SubjectsPage />
    </Suspense>
  );
}
