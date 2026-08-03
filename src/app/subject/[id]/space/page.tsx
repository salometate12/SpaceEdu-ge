import { SubjectSpacePage } from "@/components/abiturient/SubjectSpacePage";
import { SUBJECT_HUB_IDS } from "@/lib/abiturient-subject-hub";

interface SubjectSpaceRouteProps {
  params: Promise<{ id: string }>;
}

// Georgian has its own bespoke /subject/georgian/space page (a static route,
// which Next.js always prefers over this dynamic one for that exact path),
// so it's excluded here to avoid generating a duplicate placeholder for it.
export async function generateStaticParams() {
  return SUBJECT_HUB_IDS.filter((id) => id !== "georgian").map((id) => ({ id }));
}

export default async function SubjectSpaceRoute({ params }: SubjectSpaceRouteProps) {
  const { id } = await params;
  return <SubjectSpacePage subjectId={id} />;
}
