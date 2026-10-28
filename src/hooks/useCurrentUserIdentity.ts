"use client";

import { useEffect, useState } from "react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";

export interface UserIdentity {
  name: string | null;
  email: string | null;
}

function readName(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null;
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = metadata[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };
  const full = pick("full_name", "name");
  if (full) return full;
  const first = pick("firstName", "first_name");
  const last = pick("lastName", "last_name");
  // Registration stores the first name as the last one too when there was only one word.
  return [first, last && last !== first ? last : null].filter(Boolean).join(" ") || null;
}

/**
 * The signed-in user's name and email from their Supabase auth profile,
 * for the header's profile menu. Both null while loading or signed out.
 */
export function useCurrentUserIdentity(): UserIdentity {
  const [identity, setIdentity] = useState<UserIdentity>({ name: null, email: null });

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return;
    let supabase: ReturnType<typeof createBrowserSupabaseClient>;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      return;
    }
    let active = true;
    const apply = (user: { email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined) =>
      setIdentity({ name: readName(user?.user_metadata), email: user?.email ?? null });

    supabase.auth.getUser().then(({ data }) => {
      if (active) apply(data.user);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => apply(session?.user));
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return identity;
}
