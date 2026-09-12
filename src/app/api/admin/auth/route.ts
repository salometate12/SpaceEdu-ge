import { NextResponse } from "next/server";
import { enforceJsonBodyLimit } from "@/lib/request-limits";
import { verifyAdminPassword } from "@/lib/admin/auth";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const tooLarge = enforceJsonBodyLimit(request);
  if (tooLarge) return tooLarge;
  // Five tries a minute per IP — no legitimate login needs more, and it
  // turns password guessing from seconds into years.
  const limited = await enforceRateLimit(request, "admin-login");
  if (limited) return limited;

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
