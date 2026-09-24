"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  persistSpaceForRole,
  readPersistedSpace,
  resolveAuthRedirectHref,
} from "@/lib/dev-portal-bypass";
import { parseRegistrationRole } from "@/lib/registration-role";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { isAdminEmail, resolvePostLoginHref } from "@/lib/access-control";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

function accountSpaceFromMetadata(metadata: unknown): SpaceeduSpace | null {
  const value = (metadata as Record<string, unknown> | null | undefined)?.space;
  if (value === "school" || value === "abiturient" || value === "student") return value;
  return null;
}

export function AuthCompleteView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = parseRegistrationRole(searchParams.get("role")) ?? "abiturient";

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!isSupabaseBrowserConfigured()) {
        persistSpaceForRole(role);
        router.replace(resolveAuthRedirectHref(role, null));
        return;
      }
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!active) return;

        // Same rule as the login form: account space wins, then the URL role,
        // then this device's stored preference. A first-time Google sign-in has
        // no account space yet, so its chosen role gets written back (unless the
        // account is an admin, which stays space-agnostic).
        const resolution = resolvePostLoginHref({
          metadataSpace: accountSpaceFromMetadata(data.user?.user_metadata),
          roleSpace: role,
          storedSpace: readPersistedSpace(),
          isAdmin: isAdminEmail(data.user?.email),
        });

        if (resolution.persistSpace) persistSpaceForRole(resolution.persistSpace);
        if (resolution.writeSpaceToAccount) {
          try {
            await supabase.auth.updateUser({
              data: { space: resolution.writeSpaceToAccount },
            });
          } catch {
            // fall through — still route them to their destination
          }
        }
        router.replace(resolution.href);
      } catch {
        if (!active) return;
        persistSpaceForRole(role);
        router.replace(resolveAuthRedirectHref(role, null));
      }
    })();
    return () => {
      active = false;
    };
  }, [role, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#09090b]">
      <Loader2 className="h-6 w-6 animate-spin stroke-[1.5] text-pink-400" aria-hidden />
    </main>
  );
}
