"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SpaceSelectorModal } from "@/components/SpaceSelectorModal";
import { registrationHref } from "@/lib/registration-role";
import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { dashboardHrefForUserSpace, isAdminEmail } from "@/lib/access-control";
import { persistSpaceForRole } from "@/lib/dev-portal-bypass";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

function accountSpaceFromMetadata(metadata: unknown): SpaceeduSpace | null {
  const value = (metadata as Record<string, unknown> | null | undefined)?.space;
  if (value === "school" || value === "abiturient" || value === "student") return value;
  return null;
}

export default function SelectSpacePage() {
  const router = useRouter();
  // "checking" until we know the session; "guest" = signed out (or no auth
  // configured); "needs-space" = signed in but no space chosen yet; "admin" =
  // signed in as an admin, who uses this page to switch spaces freely. A normal
  // signed-in user who already has a space is replaced to their dashboard and
  // never sees the form (this backs up the middleware rule for dev / edge cases).
  const [status, setStatus] = useState<"checking" | "guest" | "needs-space" | "admin">(
    "checking",
  );

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!isSupabaseBrowserConfigured()) {
        if (active) setStatus("guest");
        return;
      }
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (!active) return;
        const user = data.user;
        if (!user) {
          setStatus("guest");
          return;
        }
        // Admins are never auto-redirected: this page is how they switch spaces,
        // so they always see the chooser even when their account has a space.
        if (isAdminEmail(user.email)) {
          setStatus("admin");
          return;
        }
        const space = accountSpaceFromMetadata(user.user_metadata);
        if (space) {
          router.replace(dashboardHrefForUserSpace(space));
          return; // stay "checking" so the form never flashes
        }
        setStatus("needs-space");
      } catch {
        if (active) setStatus("guest");
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const handleSelect = async (spaceId: "school" | "abiturient" | "student") => {
    // Admin: just switch to the chosen space's dashboard. Never write the space
    // onto the account — that would lock the admin into one space and undo the
    // free switching this page exists to give them.
    if (status === "admin") {
      if (spaceId === "abiturient" || spaceId === "student") persistSpaceForRole(spaceId);
      router.replace(dashboardHrefForUserSpace(spaceId));
      return;
    }

    // Signed in but without a space yet: write the choice onto the account and
    // go to the dashboard — no re-registration.
    if (status === "needs-space") {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.updateUser({ data: { space: spaceId } });
      } catch {
        // fall through — still try to route them onward
      }
      if (spaceId === "abiturient" || spaceId === "student") persistSpaceForRole(spaceId);
      router.replace(dashboardHrefForUserSpace(spaceId));
      return;
    }

    // Signed out: unchanged — go register into the chosen space.
    if (spaceId === "abiturient" || spaceId === "student") {
      router.push(registrationHref(spaceId));
    }
  };

  if (status === "checking") {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-pink-400" aria-hidden />
      </main>
    );
  }

  // A signed-in (but space-less) user's "back" goes to the landing page rather
  // than the previous page, so it can't bounce back into this chooser.
  return (
    <SpaceSelectorModal
      onSelect={handleSelect}
      backHref={status === "needs-space" ? "/" : undefined}
    />
  );
}
