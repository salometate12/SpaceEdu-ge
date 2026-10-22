"use client";

import { useEffect } from "react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { getUserStore, supabaseUserData } from "@/lib/user-data";
import { connectPresentations, disconnectPresentations, refreshPresentations } from "@/lib/presentation-sync-client";

/**
 * Keeps the user's data in step with their account (lib/user-data): pulls
 * it on sign-in (uploading what was only on this device), re-reads it when
 * the tab comes back into view or the connection returns, and clears it
 * from the device on sign-out. Signed out, everything stays local.
 */
export function UserDataSync() {
  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return;
    let supabase: ReturnType<typeof createBrowserSupabaseClient>;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      return;
    }
    const store = getUserStore();
    let userId: string | null = null;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const next = session?.user?.id ?? null;
      if (event === "SIGNED_OUT") {
        userId = null;
        store.disconnect();
        void disconnectPresentations();
        return;
      }
      if (!next) {
        store.detach();
        return;
      }
      if (next === userId) return;
      userId = next;
      // Outside the auth callback: Supabase calls made inside it can deadlock.
      setTimeout(() => {
        void store.connect(next, supabaseUserData(supabase, next));
        void connectPresentations(supabase, next);
      }, 0);
    });

    const refresh = () => {
      if (!userId || document.visibilityState !== "visible") return;
      void store.refresh();
      void refreshPresentations();
    };
    const online = () => {
      if (!userId) return;
      void store.refresh();
      void refreshPresentations();
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", online);
    return () => {
      data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", online);
    };
  }, []);

  return null;
}
