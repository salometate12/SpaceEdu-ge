import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/utils/supabase/env";

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

export async function middleware(request: NextRequest) {
  // Local dev keeps the existing password-free bypass used by the login/registration forms.
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL("/select-space", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
