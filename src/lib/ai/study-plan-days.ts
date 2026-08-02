export const MAX_STUDY_PLAN_DAYS = 30;

export function daysUntilExam(examDateIso: string, today = new Date()): number {
  const exam = new Date(`${examDateIso}T12:00:00`);
  if (Number.isNaN(exam.getTime())) return 0;
  const start = new Date(today.toISOString().slice(0, 10) + "T12:00:00");
  const diffMs = exam.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function studyPlanDaysToGenerate(examDateIso: string, today = new Date()): number {
  const remaining = daysUntilExam(examDateIso, today);
  if (remaining === 0) return 1;
  return Math.min(remaining, MAX_STUDY_PLAN_DAYS);
}
