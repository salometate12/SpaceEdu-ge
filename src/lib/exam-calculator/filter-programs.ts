import { buildProgramPrediction } from "./program-prediction";
import { compatibilityLabel } from "./prediction-status";
import type {
  CalculatorMatch,
  CalculatorPrediction,
  HandbookData,
  HandbookProgram,
  UserScores,
} from "./types";

function scoreForSubject(scores: UserScores, subjectId: string): number | undefined {
  const value = scores[subjectId as keyof UserScores];
  return typeof value === "number" && !Number.isNaN(value) ? value : undefined;
}

function meetsRequirement(
  scores: UserScores,
  req: { subjectId: string; minThreshold: number },
): boolean {
  const score = scoreForSubject(scores, req.subjectId);
  if (score == null) return false;
  return score >= req.minThreshold;
}

function hasExamRequirements(program: HandbookProgram): boolean {
  if (program.exams.mandatory.length > 0) return true;
  return program.exams.oneOf.some((group) => group.length > 0);
}

function programMatches(scores: UserScores, program: HandbookProgram): boolean {
  if (!hasExamRequirements(program)) return false;

  for (const req of program.exams.mandatory) {
    if (!meetsRequirement(scores, req)) return false;
  }
  for (const group of program.exams.oneOf) {
    if (group.length === 0) continue;
    const groupOk = group.some((req) => meetsRequirement(scores, req));
    if (!groupOk) return false;
  }
  return true;
}

function matchedSubjects(program: HandbookProgram, scores: UserScores): string[] {
  const used = new Set<string>();
  for (const req of program.exams.mandatory) {
    if (meetsRequirement(scores, req)) used.add(req.subjectId);
  }
  for (const group of program.exams.oneOf) {
    for (const req of group) {
      if (meetsRequirement(scores, req)) used.add(req.subjectId);
    }
  }
  return [...used];
}

function toMatch(
  program: HandbookProgram,
  scores: UserScores,
  university: string,
): CalculatorMatch {
  const prediction = buildProgramPrediction(program, scores);
  return {
    code: program.code,
    institutionCode: program.institutionCode,
    university,
    faculty: program.faculty,
    slots: program.slots,
    threshold: prediction.threshold,
    matchedSubjects: matchedSubjects(program, scores) as CalculatorMatch["matchedSubjects"],
    userScore: prediction.userScore,
    electiveSubject: prediction.electiveSubject,
    status: prediction.status,
    statusLabel: prediction.statusLabel,
    advisoryMessage: prediction.advisoryMessage,
  };
}

export function filterPrograms(
  data: HandbookData,
  scores: UserScores,
): CalculatorMatch[] {
  const institutionNames = new Map(
    data.institutions.map((i) => [
      i.code,
      i.name ?? (i.hint ? i.hint : `დაწესებულება ${i.code}`),
    ]),
  );

  return data.programs
    .filter((p) => programMatches(scores, p))
    .map((p) =>
      toMatch(
        p,
        scores,
        institutionNames.get(p.institutionCode) ?? p.institutionCode,
      ),
    )
    .sort((a, b) => {
      const statusOrder = { high: 0, medium: 1, minimal: 2 };
      const diff = statusOrder[a.status] - statusOrder[b.status];
      if (diff !== 0) return diff;
      return b.userScore - b.threshold - (a.userScore - a.threshold);
    });
}

export function findProgramByCode(
  data: HandbookData,
  code: string,
): HandbookProgram | undefined {
  return data.programs.find((p) => p.code === code);
}

export function buildPredictionForProgram(
  data: HandbookData,
  scores: UserScores,
  code: string,
): CalculatorPrediction | null {
  const program = findProgramByCode(data, code);
  if (!program) return null;

  const institutionNames = new Map(
    data.institutions.map((i) => [
      i.code,
      i.name ?? (i.hint ? i.hint : `დაწესებულება ${i.code}`),
    ]),
  );

  const match = toMatch(
    program,
    scores,
    institutionNames.get(program.institutionCode) ?? program.institutionCode,
  );

  return { ...match, compatibilityLabel: compatibilityLabel(match.status) };
}

export function pickPrimaryPrediction(
  data: HandbookData,
  scores: UserScores,
  results: CalculatorMatch[],
  focusCode?: string,
): CalculatorPrediction | null {
  if (focusCode) {
    return buildPredictionForProgram(data, scores, focusCode);
  }
  if (results.length === 0) return null;
  const top = results[0];
  return { ...top, compatibilityLabel: compatibilityLabel(top.status) };
}
