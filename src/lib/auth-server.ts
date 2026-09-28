import { cookies } from "next/headers";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { isAdminEmail } from "@/lib/access-control";
import { ACTIVE_SPACE_COOKIE, parseSpace, resolveWorkingSpace } from "@/lib/active-space";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

export interface ServerUserName {
  firstName: string;
  lastName: string;
}

function readString(metadata: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!metadata) return "";
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

/**
 * Server-side read of the signed-in user's registered name (Server
 * Components / route handlers only — uses the cookie-based Supabase
 * client). Returns null when there's no session or Supabase isn't
 * configured, so callers can fall back to placeholder content.
 */
export async function getCurrentServerUserName(): Promise<ServerUserName | null> {
  if (!isSupabaseBrowserConfigured()) return null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const metadata = data.user?.user_metadata as Record<string, unknown> | undefined;
    const firstName = readString(metadata, "firstName", "first_name");
    const lastName = readString(metadata, "lastName", "last_name");

    if (!firstName && !lastName) return null;
    return { firstName, lastName };
  } catch {
    return null;
  }
}

/**
 * What the signed-in user's account is registered as, for the settings menu
 * (whose "მიმოხილვა"/"სტატისტიკა" links point at the space-specific profile).
 * Returns null when there's no session, no space, or Supabase isn't configured.
 */
export async function getServerAccountSpace(): Promise<SpaceeduSpace | null> {
  if (!isSupabaseBrowserConfigured()) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const value = (data.user?.user_metadata as Record<string, unknown> | undefined)?.space;
    if (value === "school" || value === "abiturient" || value === "student") return value;
    return null;
  } catch {
    return null;
  }
}

/**
 * The working space for a page whose URL belongs to no space (e.g.
 * /settings/*): the remembered space from the `spaceedu_active_space`
 * cookie, else the account's own space, else null — plus whether the
 * viewer is an admin, for where "no space" links should go. Only chooses
 * which links to show; access is still checked by the middleware.
 */
export async function getServerWorkingSpace(): Promise<{
  space: SpaceeduSpace | null;
  isAdmin: boolean;
}> {
  const cookieStore = await cookies();
  const cookieSpace = parseSpace(cookieStore.get(ACTIVE_SPACE_COOKIE)?.value);

  let accountSpace: SpaceeduSpace | null = null;
  let isAdmin = false;
  if (isSupabaseBrowserConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await supabase.auth.getUser();
      accountSpace = parseSpace(
        (data.user?.user_metadata as Record<string, unknown> | undefined)?.space as
          | string
          | undefined,
      );
      isAdmin = isAdminEmail(data.user?.email);
    } catch {
      /* no session — fall back to the cookie alone */
    }
  }

  return {
    space: resolveWorkingSpace({ pathname: null, cookieSpace, accountSpace }),
    isAdmin,
  };
}

/** The account's subscription-related fields and creation time, server-side. */
export interface ServerAccountMeta {
  metadata: Record<string, unknown>;
  createdAt: string | null;
  email: string | null;
}

export async function getServerAccountMeta(): Promise<ServerAccountMeta | null> {
  if (!isSupabaseBrowserConfigured()) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return {
      metadata: (data.user.user_metadata as Record<string, unknown> | undefined) ?? {},
      createdAt: data.user.created_at ?? null,
      email: data.user.email ?? null,
    };
  } catch {
    return null;
  }
}
