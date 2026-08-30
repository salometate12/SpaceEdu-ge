"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { persistSpaceForRole, resolveAuthRedirectHref } from "@/lib/dev-portal-bypass";
import { parseRegistrationRole } from "@/lib/registration-role";

export function AuthCompleteView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = parseRegistrationRole(searchParams.get("role")) ?? "abiturient";

  useEffect(() => {
    const sync = () => {
      persistSpaceForRole(role);
      router.replace(resolveAuthRedirectHref(role, null));
    };
    sync();
  }, [role, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <Loader2 className="h-6 w-6 animate-spin stroke-[1.5] text-purple-400" aria-hidden />
    </main>
  );
}
