"use client";

import { useEffect } from "react";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { getUserStore, markAccountDataIn, supabaseUserData } from "@/lib/user-data";
import { connectPresentations, disconnectPresentations, refreshPresentations } from "@/lib/presentation-sync-client";
import {
  connectGenerationJobs,
  disconnectGenerationJobs,
  hasOutsideGenerations,
  reconcileGenerations,
} from "@/lib/library/generation";
import { connectUserFiles, disconnectUserFiles } from "@/lib/user-files";
import { clearSubjectFilesCache } from "@/lib/subject-files-client";
import { clearDocumentsCache } from "@/lib/important-documents";
import { runLectureNotesMigration } from "@/lib/migrations/lecture-notes-to-subjects";
import { LECTURE_NOTES_UPDATED_EVENT } from "@/lib/user-data-keys";

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
  // Lecture notes move to „ჩემი საგნები“ once the account's copy is in (not
  // mid-sync: the subjects they match may not be here yet), and again when
  // another device's old list arrives.
  useEffect(() => {
    const store = getUserStore();
    const migrate = () => {
      if (store.status() !== "syncing") runLectureNotesMigration();
    };
    migrate();
    const stopStatus = store.subscribeStatus(migrate);
    window.addEventListener(LECTURE_NOTES_UPDATED_EVENT, migrate);
    return () => {
      stopStatus();
      window.removeEventListener(LECTURE_NOTES_UPDATED_EVENT, migrate);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      markAccountDataIn();
      return;
    }
    let supabase: ReturnType<typeof createBrowserSupabaseClient>;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      markAccountDataIn();
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
        // This device's copies of the files go too: the next account here mustn't see them.
        disconnectUserFiles();
        clearSubjectFilesCache();
        clearDocumentsCache();
        void disconnectPresentations();
        markAccountDataIn();
        return;
      }
      if (!next) {
        store.detach();
        disconnectGenerationJobs();
        disconnectUserFiles();
        markAccountDataIn();
        return;
      }
      if (next === userId) return;
      userId = next;
      // Outside the auth callback: Supabase calls made inside it can deadlock.
      setTimeout(() => {
        void connectPresentations(supabase, next);
        connectGenerationJobs(supabase, next);
        void store.connect(next, supabaseUserData(supabase, next)).finally(() => {
          // Files first known from the account go up only now, and tools waiting on them can read them.
          if (userId === next) connectUserFiles(supabase, next);
          markAccountDataIn();
        });
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
