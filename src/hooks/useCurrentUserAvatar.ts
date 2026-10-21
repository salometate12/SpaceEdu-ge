"use client";

import { useEffect, useState } from "react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { AVATAR_CHANGED_EVENT, avatarUrlFromMetadata, customAvatarUrl, providerAvatarUrl } from "@/lib/avatar";

export interface UserAvatar {
  /** First letter of the first name (or e-mail); null while loading. */
  initial: string | null;
  /** The uploaded photo, else the sign-in provider's (Google), if any. */
  photoUrl: string | null;
  /** Just the uploaded photo / just Google's (the settings form needs both). */
  customPhotoUrl: string | null;
  providerPhotoUrl: string | null;
  /** True once the account has been read. */
  loaded: boolean;
}

const EMPTY: UserAvatar = { initial: null, photoUrl: null, customPhotoUrl: null, providerPhotoUrl: null, loaded: false };

/** First letter of a name, as one whole character (also for Georgian). */
export function initialOf(text: string | null | undefined): string | null {
  const first = Array.from((text ?? "").trim())[0];
  return first ? first.toLocaleUpperCase("en") : null;
}

/** The signed-in user's avatar for small UI (header, profile menu, dock). Follows uploads live. */
export function useCurrentUserAvatar(): UserAvatar {
  const [avatar, setAvatar] = useState<UserAvatar>(EMPTY);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return;
    let active = true;
    const load = () => {
      try {
        const supabase = createBrowserSupabaseClient();
        supabase.auth.getUser().then(({ data }) => {
          if (!active || !data.user) return;
          const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
          const name = [meta.firstName, meta.first_name, meta.full_name, meta.name, data.user.email].find(
            (value): value is string => typeof value === "string" && value.trim().length > 0,
          );
          setAvatar({
            initial: initialOf(name),
            photoUrl: avatarUrlFromMetadata(meta),
            customPhotoUrl: customAvatarUrl(meta),
            providerPhotoUrl: providerAvatarUrl(meta),
            loaded: true,
          });
        });
      } catch {
        // no Supabase — the generic icon stays
      }
    };
    load();
    window.addEventListener(AVATAR_CHANGED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(AVATAR_CHANGED_EVENT, load);
    };
  }, []);

  return avatar;
}
