import { EssayGrader } from "@/components/abiturient/exams/EssayGrader";
import { SUBJECT_HUB_IDS } from "@/lib/abiturient-subject-hub";

interface EssayGraderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return SUBJECT_HUB_IDS.filter((id) => id !== "georgian").map((id) => ({ id }));
}

export default async function SubjectEssayGraderPage({ params }: EssayGraderPageProps) {
  const { id } = await params;
  return <EssayGrader subjectId={id} />;
}
