import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/utils/supabase/env";
import { getSpaceRedirectHref, isAdminEmail } from "@/lib/access-control";
import {
  hasActivePlan,
  isPaywallEnabled,
  isPaywalledPath,
  isTrialExpired,
  PAYWALL_REASON_PARAM,
  readEntitlement,
  TRIAL_EXPIRED_REASON,
} from "@/lib/subscription";
import { CHECKOUT_HREF } from "@/lib/checkout-routes";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

/**
 * The one middleware.
 *
 * There used to be two: this file, and `src/middleware.ts` calling
 * `updateSession`. Next runs only one of them — the compiled edge bundle
 * contained this file's `/select-space` redirect and none of the other's
 * paywall code — so the session refresh, the three-day trial gate and the
 * space guards had never actually run. They are folded in here, in the
 * order they have to happen:
 *
 *   1. refresh the Supabase session (writes rotated cookies onto the
 *      response, which is the whole reason this runs on every request);
 *   2. signed out, on a private path → /select-space;
 *   3. signed in: trial expired on a paid path → checkout;
 *   4. signed in: wrong space for this route → their own dashboard.
 */

/** Pages anyone can view without being logged in. Everything else requires a session. */
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/registration",
  "/select-space",
  "/pricing",
  "/privacy",
  "/terms",
  "/auth/callback",
  "/auth/complete",
]);

/**
 * Files Next generates from `app/` that carry no dot in their URL.
 *
 * The dot test below is what lets `/favicon.ico` and `/manifest.webmanifest`
 * through, and these have no extension to catch — so the gate was sending
 * every crawler that asked for the link-preview card to /select-space and
 * handing it an HTML page instead of a PNG. That is why search and social
 * showed the wrong image.
 */
const PUBLIC_METADATA_PATHS = new Set([
  "/opengraph-image",
  "/twitter-image",
  "/icon",
  "/apple-icon",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_METADATA_PATHS.has(pathname)) return true;
  // Next appends a cache-busting segment to generated metadata routes,
  // e.g. /opengraph-image/opengraph-image.png or /icon/route-id.
  if (/^\/(opengraph-image|twitter-image|icon|apple-icon)(\/|-|$)/.test(pathname)) return true;
  if (pathname.startsWith("/admin")) return true; // has its own password gate
  if (pathname.startsWith("/api/")) return true; // API routes enforce their own auth
  if (pathname.includes(".")) return true; // static files (favicon, images, robots.txt, etc.)
  return false;
}

function readAccountSpace(metadata: Record<string, unknown> | undefined): SpaceeduSpace | null {
  const value = metadata?.space;
  if (value === "school" || value === "abiturient" || value === "student") {
    return value;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  // Local dev keeps the existing password-free bypass used by the
  // login/registration forms. Unchanged from before the merge: turning the
  // gate on locally would lock development out of every tool.
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Runs on public paths too: this is what rotates an expiring session, and
  // a reader sitting on the landing page should not be signed out for it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isPublicPath(pathname)) return response;
    return NextResponse.redirect(new URL("/select-space", request.url));
  }

  if (isAdminEmail(user.email)) {
    return response;
  }

  const metadata = user.user_metadata as Record<string, unknown> | undefined;

  // The three-day trial. Counted from the account's own creation time, so
  // nothing extra has to be stored, and lifted the moment a payment writes
  // an entitlement. Gated by isPaywallEnabled() — off until a live payment
  // provider exists, so no one is sent to a checkout that cannot charge.
  if (
    isPaywallEnabled() &&
    isPaywalledPath(pathname) &&
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
    const redirectHref = getSpaceRedirectHref(pathname, accountSpace);
    if (redirectHref) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = redirectHref;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
