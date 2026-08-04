"use client";

import { useEffect, useState } from "react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";

function extractFirstName(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null;
  const firstName = metadata.firstName ?? metadata.first_name;
  if (typeof firstName === "string" && firstName.trim().length > 0) {
    return firstName.trim();
  }
  return null;
}

/**
 * Reads the signed-in user's first name from their Supabase auth profile
 * (set at registration). Returns null while loading or when there's no
 * session / Supabase isn't configured — callers should fall back to a
 * generic greeting in that case.
 */
export function useCurrentUserFirstName(): string | null {
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return;

    let supabase: ReturnType<typeof createBrowserSupabaseClient>;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      return;
    }

    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setFirstName(extractFirstName(data.user?.user_metadata));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setFirstName(extractFirstName(session?.user?.user_metadata));
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return firstName;
}
