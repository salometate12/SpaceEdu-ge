import { NextResponse } from "next/server";
import { enforceJsonBodyLimit } from "@/lib/request-limits";
import { verifyAdminPassword } from "@/lib/admin/auth";

export async function POST(request: Request) {
  const tooLarge = enforceJsonBodyLimit(request);
  if (tooLarge) return tooLarge;

  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
