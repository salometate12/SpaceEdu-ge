import { NextResponse } from "next/server";
import { getPasswordFromRequest, unauthorizedResponse, verifyAdminPassword } from "@/lib/admin/auth";
import {
  handbookAvailable,
  loadHandbook,
  seedHandbookToSupabase,
} from "@/lib/exam-calculator/load-handbook";
import { isSupabaseStorageConfigured } from "@/lib/supabase/admin-server";

function assertAuthorized(request: Request) {
  const password = getPasswordFromRequest(request);
  if (!verifyAdminPassword(password)) return unauthorizedResponse();
  return null;
}

/** POST — seed Supabase from bundled data/universities.json (one-time migration). */
export async function POST(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  if (!isSupabaseStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Vercel.",
      },
      { status: 503 },
    );
  }

  if (!(await handbookAvailable())) {
    return NextResponse.json({ error: "No handbook source found to seed." }, { status: 404 });
  }

  try {
    const source = await loadHandbook();
    await seedHandbookToSupabase(source);
    return NextResponse.json({
      ok: true,
      programCount: source.programs.length,
      institutionCount: source.institutions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
