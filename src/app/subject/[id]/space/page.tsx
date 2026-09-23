import { SubjectSpacePage } from "@/components/abiturient/SubjectSpacePage";
import { SUBJECT_HUB_IDS } from "@/lib/abiturient-subject-hub";

interface SubjectSpaceRouteProps {
  params: Promise<{ id: string }>;
}

// Georgian, maths, history, English, geography, chemistry and civics each have
// their own bespoke /subject/<id>/space hub (static routes Next.js prefers over
// this dynamic one), so they're excluded here to avoid generating a duplicate
// placeholder.
const BESPOKE_SPACE_HUBS = new Set([
  "georgian",
  "math",
  "history",
  "english",
  "geography",
  "chemistry",
  "civics",
]);

export async function generateStaticParams() {
  return SUBJECT_HUB_IDS.filter((id) => !BESPOKE_SPACE_HUBS.has(id)).map((id) => ({ id }));
}

export default async function SubjectSpaceRoute({ params }: SubjectSpaceRouteProps) {
  const { id } = await params;
  return <SubjectSpacePage subjectId={id} />;
}
