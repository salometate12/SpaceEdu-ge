import { AbiturientSubjectHub } from "@/components/abiturient/AbiturientSubjectHub";
import { SUBJECT_HUB_IDS } from "@/lib/abiturient-subject-hub";

interface SubjectPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return SUBJECT_HUB_IDS.filter((id) => id !== "georgian").map((id) => ({ id }));
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { id } = await params;
  return <AbiturientSubjectHub subjectId={id} />;
}
