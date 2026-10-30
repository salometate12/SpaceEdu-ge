"use client";

import { useEffect } from "react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { getUserStore, supabaseUserData } from "@/lib/user-data";
import { connectPresentations, disconnectPresentations, refreshPresentations } from "@/lib/presentation-sync-client";
import {
  connectGenerationJobs,
  disconnectGenerationJobs,
  hasOutsideGenerations,
  reconcileGenerations,
} from "@/lib/library/generation";

/** How often a deck or quiz being made elsewhere (another tab, the server) is checked. */
const GENERATION_POLL_MS = 3000;

/**
 * Keeps the user's data in step with their account (lib/user-data): pulls
 * it on sign-in (uploading what was only on this device), re-reads it when
 * the tab comes back into view or the connection returns, and clears it
 * from the device on sign-out. Signed out, everything stays local. Changes
 * are sent right away when the page is hidden or closed (a quiz answered a
 * moment ago), and decks or quizzes generating out of this tab are
 * checked every 3 seconds (lib/library/generation).
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
        disconnectGenerationJobs();
        void disconnectPresentations();
        return;
      }
      if (!next) {
        store.detach();
        disconnectGenerationJobs();
        return;
      }
      if (next === userId) return;
      userId = next;
      // Outside the auth callback: Supabase calls made inside it can deadlock.
      setTimeout(() => {
        void store.connect(next, supabaseUserData(supabase, next));
        void connectPresentations(supabase, next);
        connectGenerationJobs(supabase, next);
      }, 0);
    });

    const refresh = () => {
      if (userId && document.visibilityState === "hidden") void store.flush();
      if (!userId || document.visibilityState !== "visible") return;
      void store.refresh();
      void refreshPresentations();
    };
    const online = () => {
      if (!userId) return;
      void store.refresh();
      void refreshPresentations();
    };
    const leaving = () => {
      if (userId) void store.flush();
    };
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible" && hasOutsideGenerations()) void reconcileGenerations();
    }, GENERATION_POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", online);
    window.addEventListener("pagehide", leaving);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("pagehide", leaving);
      data.subscription.unsubscribe();
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", online);
    };
  }, []);

  return null;
}
