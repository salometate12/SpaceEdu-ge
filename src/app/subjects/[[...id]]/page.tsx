import { Suspense } from "react";
import { NoteEditor } from "@/components/subjects/NoteEditor";
import { SubjectsPage } from "@/components/subjects/SubjectsPage";
import { StudySession } from "@/components/subjects/study/StudySession";
import { StudySetup } from "@/components/subjects/study/StudySetup";

/**
 * „ჩემი საგნები“: /subjects opens the subject seen last, /subjects/<id>
 * that one, /subjects/<id>/notes/<noteId> a lecture note (`new` for a new one),
 * /subjects/<id>/study/new a study session's setup, /subjects/<id>/study/<sessionId> the session.
 */
export default async function Page({ params }: { params: Promise<{ id?: string[] }> }) {
  const { id = [] } = await params;
  if (id[1] === "notes" && id[2]) {
    return (
      <Suspense fallback={null}>
        <NoteEditor key={id[2]} subjectId={decodeURIComponent(id[0])} noteId={decodeURIComponent(id[2])} />
      </Suspense>
    );
  }
  if (id[1] === "study" && id[2]) {
    const subjectId = decodeURIComponent(id[0]);
    return (
      <Suspense fallback={null}>
        {id[2] === "new" ? <StudySetup subjectId={subjectId} /> : <StudySession key={id[2]} subjectId={subjectId} sessionId={decodeURIComponent(id[2])} />}
      </Suspense>
    );
  }
  return (
    <Suspense fallback={null}>
      <SubjectsPage />
    </Suspense>
  );
}
