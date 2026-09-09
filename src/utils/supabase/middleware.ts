import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import { getSpaceRedirectHref, isAdminEmail } from "@/lib/access-control";
import {
  hasActivePlan,
  isPaywalledPath,
  isTrialExpired,
  PAYWALL_REASON_PARAM,
  readEntitlement,
  TRIAL_EXPIRED_REASON,
} from "@/lib/subscription";
import { CHECKOUT_HREF } from "@/lib/checkout-routes";
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
    const metadata = user.user_metadata as Record<string, unknown> | undefined;

    // The three-day trial. Counted from the account's own creation time,
    // so nothing extra has to be stored, and lifted the moment a payment
    // writes an entitlement.
    if (
      isPaywalledPath(request.nextUrl.pathname) &&
      !hasActivePlan(readEntitlement(metadata)) &&
      isTrialExpired(user.created_at)
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = CHECKOUT_HREF;
      redirectUrl.search = "";
      redirectUrl.searchParams.set(PAYWALL_REASON_PARAM, TRIAL_EXPIRED_REASON);
      return NextResponse.redirect(redirectUrl);
    }

    const accountSpace = readAccountSpace(metadata);
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
