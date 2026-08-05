import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";

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
