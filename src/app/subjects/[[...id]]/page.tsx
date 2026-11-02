import { Suspense } from "react";
import { NoteEditor } from "@/components/subjects/NoteEditor";
import { SubjectsPage } from "@/components/subjects/SubjectsPage";

/**
 * „ჩემი საგნები“: /subjects opens the subject seen last, /subjects/<id>
 * that one, /subjects/<id>/notes/<noteId> a lecture note (`new` for a new one).
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
  return (
    <Suspense fallback={null}>
      <SubjectsPage />
    </Suspense>
  );
}
