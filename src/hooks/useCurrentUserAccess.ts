"use client";

import { useEffect, useState } from "react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { isAdminEmail } from "@/lib/access-control";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

function extractSpace(metadata: Record<string, unknown> | undefined): SpaceeduSpace | null {
  const value = metadata?.space;
  if (value === "school" || value === "abiturient" || value === "student") {
    return value;
  }
  return null;
}

export interface CurrentUserAccess {
  /** The space stored on the signed-in user's account (source of truth), or null while loading / signed out / no Supabase session. */
  space: SpaceeduSpace | null;
  /** True only for accounts in ADMIN_EMAILS — full access to every space. */
  isAdmin: boolean;
}

/**
 * Reads the signed-in user's assigned space and admin status straight from
 * their Supabase account (set at registration) rather than from
 * localStorage, which a determined user could edit. Server-side middleware
 * enforces the same rule; this hook lets the header/nav reflect it too.
 */
export function useCurrentUserAccess(): CurrentUserAccess {
  const [access, setAccess] = useState<CurrentUserAccess>({ space: null, isAdmin: false });

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return;

    let supabase: ReturnType<typeof createBrowserSupabaseClient>;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      return;
    }

    let active = true;

    const apply = (
      email: string | null | undefined,
      metadata: Record<string, unknown> | undefined,
    ) => {
      if (!active) return;
      setAccess({ space: extractSpace(metadata), isAdmin: isAdminEmail(email) });
    };

    supabase.auth.getUser().then(({ data }) => {
      apply(data.user?.email, data.user?.user_metadata as Record<string, unknown> | undefined);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(session?.user?.email, session?.user?.user_metadata as Record<string, unknown> | undefined);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return access;
}
