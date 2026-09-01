import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import { getSpaceRedirectHref, isAdminEmail } from "@/lib/access-control";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

function readAccountSpace(metadata: Record<string, unknown> | undefined): SpaceeduSpace | null {
  const value = metadata?.space;
  if (value === "school" || value === "abiturient" || value === "student") {
    return value;
  }
  return null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (user && !isAdminEmail(user.email)) {
    const accountSpace = readAccountSpace(user.user_metadata as Record<string, unknown> | undefined);
    if (accountSpace) {
      const redirectHref = getSpaceRedirectHref(request.nextUrl.pathname, accountSpace);
      if (redirectHref) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = redirectHref;
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}
