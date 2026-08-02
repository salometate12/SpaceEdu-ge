import { NextResponse } from "next/server";
import {
  getPasswordFromRequest,
  unauthorizedResponse,
  verifyAdminPassword,
} from "@/lib/admin/auth";
import {
  applyRowEdit,
  buildAdminUniversityRows,
  type AdminUniversityRow,
} from "@/lib/admin/handbook-rows";
import { handbookAvailable, loadHandbook, saveHandbook } from "@/lib/exam-calculator/load-handbook";

function assertAuthorized(request: Request) {
  const password = getPasswordFromRequest(request);
  if (!verifyAdminPassword(password)) {
    return unauthorizedResponse();
  }
  return null;
}

export interface UpdateProgramPayload {
  programCode: string;
  institutionCode: string;
  name: string;
  faculty: string;
  threshold: number;
  slots: number | null;
}

function parseUpdatePayload(body: unknown): UpdateProgramPayload | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const programCode = record.programCode;
  const institutionCode = record.institutionCode;
  const name = record.name;
  const faculty = record.faculty;
  const threshold = record.threshold;
  const slots = record.slots;

  if (typeof programCode !== "string" || !programCode.trim()) return null;
  if (typeof institutionCode !== "string" || !institutionCode.trim()) return null;
  if (typeof name !== "string") return null;
  if (typeof faculty !== "string") return null;
  if (typeof threshold !== "number" || Number.isNaN(threshold)) return null;
  if (slots != null && (typeof slots !== "number" || Number.isNaN(slots))) return null;

  return {
    programCode: programCode.trim(),
    institutionCode: institutionCode.trim(),
    name: name.trim(),
    faculty: faculty.trim(),
    threshold: Math.max(0, Math.round(threshold)),
    slots: slots == null ? null : Math.max(0, Math.round(slots)),
  };
}

/** PATCH a single program row and persist to data/universities.json */
export async function PATCH(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  if (!(await handbookAvailable())) {
    return NextResponse.json(
      { error: "University handbook not found." },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = parseUpdatePayload(body);
  if (!payload) {
    return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
  }

  const handbook = await loadHandbook();
  const programExists = handbook.programs.some((program) => program.code === payload.programCode);
  if (!programExists) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  const row: AdminUniversityRow = {
    programCode: payload.programCode,
    institutionCode: payload.institutionCode,
    name: payload.name,
    faculty: payload.faculty,
    threshold: payload.threshold,
    slots: payload.slots,
  };

  try {
    const updated = applyRowEdit(handbook, row);
    await saveHandbook(updated);

    const updatedRow =
      buildAdminUniversityRows(updated).find((entry) => entry.programCode === row.programCode) ??
      row;

    return NextResponse.json({
      ok: true,
      row: updatedRow,
      data: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update handbook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
