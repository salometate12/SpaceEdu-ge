import { NextResponse } from "next/server";
import {
  getPasswordFromRequest,
  unauthorizedResponse,
  verifyAdminPassword,
} from "@/lib/admin/auth";
import { buildAdminUniversityRows } from "@/lib/admin/handbook-rows";
import { handbookAvailable, loadHandbook, saveHandbook } from "@/lib/exam-calculator/load-handbook";
import type { HandbookData } from "@/lib/exam-calculator/types";

function assertAuthorized(request: Request) {
  const password = getPasswordFromRequest(request);
  if (!verifyAdminPassword(password)) {
    return unauthorizedResponse();
  }
  return null;
}

export async function GET(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  if (!(await handbookAvailable())) {
    return NextResponse.json(
      { error: "University handbook not found." },
      { status: 404 },
    );
  }

  const data = await loadHandbook();
  return NextResponse.json({
    meta: data.meta,
    data,
    rows: buildAdminUniversityRows(data),
  });
}

export async function PUT(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  let body: { data?: HandbookData };
  try {
    body = (await request.json()) as { data?: HandbookData };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.data?.institutions || !body.data?.programs) {
    return NextResponse.json({ error: "Missing handbook data" }, { status: 400 });
  }

  try {
    await saveHandbook(body.data);
    return NextResponse.json({
      ok: true,
      meta: body.data.meta,
      rowCount: body.data.programs.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save handbook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
