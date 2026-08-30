"use client";

import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";

export type RegisterSpace = "school" | "abiturient" | "student";

function getSupabaseClient() {
  if (!isSupabaseBrowserConfigured()) return null;
  try {
    return createBrowserSupabaseClient();
  } catch {
    return null;
  }
}

interface SignUpArgs {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  space: RegisterSpace;
}

export async function signUpWithEmail(args: SignUpArgs) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { userId: `mock-${Date.now()}`, hasSession: true };
  }

  const { data, error } = await supabase.auth.signUp({
    email: args.email,
    password: args.password,
    options: {
      data: {
        firstName: args.firstName,
        lastName: args.lastName,
        space: args.space,
      },
    },
  });

  if (error) throw error;
  // If Supabase has "Confirm email" enabled, signUp succeeds but returns no
  // active session until the user clicks the confirmation link in their inbox.
  return { userId: data.user?.id ?? `pending-${Date.now()}`, hasSession: data.session !== null };
}

export async function signOutUser() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function signInWithOAuthProvider(space: RegisterSpace, provider: "google" | "github") {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/register/complete?space=${space}`,
    },
  });
}

interface UserProfilePayload {
  id: string;
  first_name: string;
  last_name: string;
  space: RegisterSpace;
  school_class?: string;
  exam_subjects?: string[];
  university?: string;
  faculty?: string;
  semester?: number;
  plan: "free";
}

export async function saveUserProfile(payload: UserProfilePayload) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.from("users").upsert({
    ...payload,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
}
