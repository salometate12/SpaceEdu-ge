import { SubjectSpacePage } from "@/components/abiturient/SubjectSpacePage";
import { SUBJECT_HUB_IDS } from "@/lib/abiturient-subject-hub";

interface SubjectSpaceRouteProps {
  params: Promise<{ id: string }>;
}

// Only Georgian has a bespoke /subject/georgian/space hub (its practice
// exercises and essay grader). Every other subject uses this generic Space,
// which is a single entry point into the subject's past-exams archive.
const BESPOKE_SPACE_HUBS = new Set(["georgian"]);

export async function generateStaticParams() {
  return SUBJECT_HUB_IDS.filter((id) => !BESPOKE_SPACE_HUBS.has(id)).map((id) => ({ id }));
}

export default async function SubjectSpaceRoute({ params }: SubjectSpaceRouteProps) {
  const { id } = await params;
  return <SubjectSpacePage subjectId={id} />;
}
