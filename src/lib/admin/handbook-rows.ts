import type { HandbookData, HandbookProgram } from "@/lib/exam-calculator/types";

export interface AdminUniversityRow {
  programCode: string;
  institutionCode: string;
  name: string;
  faculty: string;
  threshold: number;
  slots: number | null;
}

/** Display threshold: highest elective (oneOf) minimum, else highest mandatory minimum. */
export function getProgramDisplayThreshold(program: HandbookProgram): number {
  const electiveThresholds = program.exams.oneOf.flatMap((group) =>
    group.map((req) => req.minThreshold),
  );
  if (electiveThresholds.length > 0) {
    return Math.max(...electiveThresholds);
  }
  const mandatoryThresholds = program.exams.mandatory.map((req) => req.minThreshold);
  if (mandatoryThresholds.length > 0) {
    return Math.max(...mandatoryThresholds);
  }
  return 0;
}

/** Updates elective thresholds when present; otherwise updates mandatory thresholds. */
export function setProgramDisplayThreshold(
  program: HandbookProgram,
  threshold: number,
): HandbookProgram {
  const value = Math.max(0, Math.round(threshold));
  const hasElectives = program.exams.oneOf.some((group) => group.length > 0);

  if (hasElectives) {
    return {
      ...program,
      exams: {
        ...program.exams,
        oneOf: program.exams.oneOf.map((group) =>
          group.map((req) => ({ ...req, minThreshold: value })),
        ),
      },
    };
  }

  return {
    ...program,
    exams: {
      ...program.exams,
      mandatory: program.exams.mandatory.map((req) => ({
        ...req,
        minThreshold: value,
      })),
    },
  };
}

export function buildAdminUniversityRows(data: HandbookData): AdminUniversityRow[] {
  const institutionNames = new Map(
    data.institutions.map((inst) => [inst.code, inst.name ?? inst.code]),
  );

  return data.programs.map((program) => ({
    programCode: program.code,
    institutionCode: program.institutionCode,
    name: institutionNames.get(program.institutionCode) ?? program.institutionCode,
    faculty: program.faculty,
    threshold: getProgramDisplayThreshold(program),
    slots: program.slots,
  }));
}

export function applyRowEdit(
  data: HandbookData,
  row: AdminUniversityRow,
): HandbookData {
  const institutions = data.institutions.map((inst) =>
    inst.code === row.institutionCode ? { ...inst, name: row.name } : inst,
  );

  const programs = data.programs.map((program) => {
    if (program.code !== row.programCode) return program;

    let updated: HandbookProgram = {
      ...program,
      faculty: row.faculty,
      slots: row.slots,
    };
    updated = setProgramDisplayThreshold(updated, row.threshold);
    return updated;
  });

  return {
    ...data,
    meta: {
      ...data.meta,
      programCount: programs.length,
      institutionCount: institutions.length,
    },
    institutions,
    programs,
  };
}
