"use client";

import { useEffect, useState } from "react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";

export interface UserAvatar {
  /** First letter of the first name (or e-mail); null while loading. */
  initial: string | null;
  /** A photo from the sign-in provider (e.g. Google), if there is one. */
  photoUrl: string | null;
}

/** First letter of a name, as one whole character (also for Georgian). */
export function initialOf(text: string | null | undefined): string | null {
  const first = Array.from((text ?? "").trim())[0];
  return first ? first.toLocaleUpperCase("en") : null;
}

/** The signed-in user's avatar for small UI (the dock's profile tab). */
export function useCurrentUserAvatar(): UserAvatar {
  const [avatar, setAvatar] = useState<UserAvatar>({ initial: null, photoUrl: null });

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return;
    let active = true;
    try {
      const supabase = createBrowserSupabaseClient();
      supabase.auth.getUser().then(({ data }) => {
        if (!active || !data.user) return;
        const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
        const name = [meta.firstName, meta.first_name, meta.full_name, meta.name, data.user.email].find(
          (value): value is string => typeof value === "string" && value.trim().length > 0,
        );
        const photo = [meta.avatar_url, meta.picture].find(
          (value): value is string => typeof value === "string" && /^https:\/\//.test(value),
        );
        setAvatar({ initial: initialOf(name), photoUrl: photo ?? null });
      });
    } catch {
      // no Supabase — the generic icon stays
    }
    return () => {
      active = false;
    };
  }, []);

  return avatar;
}
