"use client";

import { useEffect, useState } from "react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { isAdminEmail } from "@/lib/access-control";
import { readEntitlement, type Entitlement } from "@/lib/subscription";
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
  /** When the account was created: the free trial counts from here. */
  createdAt: string | null;
  /** The paid plan on the account, if any. */
  entitlement: Entitlement;
}

const SIGNED_OUT: CurrentUserAccess = {
  space: null,
  isAdmin: false,
  createdAt: null,
  entitlement: { plan: null, paidUntil: null },
};

/**
 * Reads the signed-in user's assigned space and admin status straight from
 * their Supabase account (set at registration) rather than from
 * localStorage, which a determined user could edit. Server-side middleware
 * enforces the same rule; this hook lets the header/nav reflect it too.
 */
export function useCurrentUserAccess(): CurrentUserAccess {
  const [access, setAccess] = useState<CurrentUserAccess>(SIGNED_OUT);

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
      createdAt: string | null | undefined,
    ) => {
      if (!active) return;
      setAccess({
        space: extractSpace(metadata),
        isAdmin: isAdminEmail(email),
        createdAt: createdAt ?? null,
        entitlement: readEntitlement(metadata),
      });
    };

    supabase.auth.getUser().then(({ data }) => {
      apply(
        data.user?.email,
        data.user?.user_metadata as Record<string, unknown> | undefined,
        data.user?.created_at,
      );
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      apply(
        session?.user?.email,
        session?.user?.user_metadata as Record<string, unknown> | undefined,
        session?.user?.created_at,
      );
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return access;
}
