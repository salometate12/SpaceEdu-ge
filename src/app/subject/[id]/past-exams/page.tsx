import { PastExamsArchive } from "@/components/abiturient/exams/PastExamsArchive";
import { SUBJECT_HUB_IDS } from "@/lib/abiturient-subject-hub";

interface PastExamsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return SUBJECT_HUB_IDS.filter((id) => id !== "georgian").map((id) => ({ id }));
}

export default async function SubjectPastExamsPage({ params }: PastExamsPageProps) {
  const { id } = await params;
  return <PastExamsArchive subjectId={id} />;
}
