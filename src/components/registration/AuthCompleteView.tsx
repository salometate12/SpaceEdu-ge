"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { persistSpaceForRole, resolveAuthRedirectHref } from "@/lib/dev-portal-bypass";
import { parseRegistrationRole } from "@/lib/registration-role";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { dashboardHrefForUserSpace } from "@/lib/access-control";
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
        // A returning account's own space wins — it is never asked to choose again.
        const accountSpace = accountSpaceFromMetadata(data.user?.user_metadata);
        if (accountSpace) {
          if (accountSpace === "abiturient" || accountSpace === "student") persistSpaceForRole(accountSpace);
          router.replace(dashboardHrefForUserSpace(accountSpace));
          return;
        }
        // First Google sign-in: record the chosen role as the account's space.
        try {
          await supabase.auth.updateUser({ data: { space: role } });
        } catch {
          // fall through — still route them to their dashboard
        }
        persistSpaceForRole(role);
        router.replace(dashboardHrefForUserSpace(role));
      } catch {
        if (!active) return;
        persistSpaceForRole(role);
        router.replace(dashboardHrefForUserSpace(role));
      }
    })();
    return () => {
      active = false;
    };
  }, [role, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <Loader2 className="h-6 w-6 animate-spin stroke-[1.5] text-pink-400" aria-hidden />
    </main>
  );
}
