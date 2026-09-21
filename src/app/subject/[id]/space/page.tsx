import { SubjectSpacePage } from "@/components/abiturient/SubjectSpacePage";
import { SUBJECT_HUB_IDS } from "@/lib/abiturient-subject-hub";

interface SubjectSpaceRouteProps {
  params: Promise<{ id: string }>;
}

// Georgian, maths and history each have their own bespoke /subject/<id>/space
// page (static routes, which Next.js always prefers over this dynamic one for
// that exact path), so they're excluded here to avoid generating a duplicate
// placeholder for them.
const BESPOKE_SPACE_HUBS = new Set(["georgian", "math", "history"]);

export async function generateStaticParams() {
  return SUBJECT_HUB_IDS.filter((id) => !BESPOKE_SPACE_HUBS.has(id)).map((id) => ({ id }));
}

export default async function SubjectSpaceRoute({ params }: SubjectSpaceRouteProps) {
  const { id } = await params;
  return <SubjectSpacePage subjectId={id} />;
}
