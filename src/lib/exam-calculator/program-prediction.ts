import { subjectLabel } from "./subjects";
import {
  getPredictionStatus,
  PREDICTION_ADVISORY,
  PREDICTION_STATUS_LABEL,
  type PredictionStatus,
} from "./prediction-status";
import type { ExamSubjectId, HandbookProgram, UserScores } from "./types";

const ELECTIVE_IDS = new Set<ExamSubjectId>([
  "math",
  "physics",
  "chemistry",
  "biology",
  "history",
  "geography",
  "civics",
]);

export interface ProgramPrediction {
  userScore: number;
  threshold: number;
  electiveSubjectId: ExamSubjectId;
  electiveSubject: string;
  status: PredictionStatus;
  statusLabel: string;
  advisoryMessage: string;
}

function scoreForSubject(scores: UserScores, subjectId: ExamSubjectId): number | undefined {
  const value = scores[subjectId];
  return typeof value === "number" && !Number.isNaN(value) ? value : undefined;
}

function allRequirements(program: HandbookProgram) {
  const list: { subjectId: ExamSubjectId; minThreshold: number; isElective: boolean }[] = [];
  for (const req of program.exams.mandatory) {
    list.push({
      subjectId: req.subjectId,
      minThreshold: req.minThreshold,
      isElective: ELECTIVE_IDS.has(req.subjectId),
    });
  }
  for (const group of program.exams.oneOf) {
    for (const req of group) {
      list.push({
        subjectId: req.subjectId,
        minThreshold: req.minThreshold,
        isElective: ELECTIVE_IDS.has(req.subjectId),
      });
    }
  }
  return list;
}

/** Picks the elective binding used for score vs threshold display. */
export function buildProgramPrediction(
  program: HandbookProgram,
  scores: UserScores,
): ProgramPrediction {
  const requirements = allRequirements(program);

  const scored = requirements
    .map((req) => {
      const userScore = scoreForSubject(scores, req.subjectId);
      if (userScore == null) return null;
      return {
        ...req,
        userScore,
        margin: userScore - req.minThreshold,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);

  const electiveMatches = scored.filter((r) => r.isElective);
  const binding =
    electiveMatches.sort((a, b) => b.margin - a.margin)[0] ??
    [...scored].sort((a, b) => a.margin - b.margin)[0] ??
    requirements.find((r) => r.isElective) ??
    requirements[0];

  if (!binding) {
    return {
      userScore: scoreForSubject(scores, "georgian") ?? 0,
      threshold: 0,
      electiveSubjectId: "georgian",
      electiveSubject: subjectLabel("georgian"),
      status: "minimal",
      statusLabel: PREDICTION_STATUS_LABEL.minimal,
      advisoryMessage: PREDICTION_ADVISORY.minimal,
    };
  }

  const userScore = scoreForSubject(scores, binding.subjectId) ?? 0;
  const threshold = binding.minThreshold;
  const status = getPredictionStatus(userScore, threshold);

  return {
    userScore,
    threshold,
    electiveSubjectId: binding.subjectId,
    electiveSubject: subjectLabel(binding.subjectId),
    status,
    statusLabel: PREDICTION_STATUS_LABEL[status],
    advisoryMessage: PREDICTION_ADVISORY[status],
  };
}
