"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock } from "lucide-react";
import { useCurrentUserAccess } from "@/hooks/useCurrentUserAccess";
import { CHECKOUT_HREF } from "@/lib/checkout-routes";
import {
  hasActivePlan,
  isPaywalledPath,
  trialDaysRemaining,
} from "@/lib/subscription";

/**
 * A quiet heads-up on the last day of the free trial, so the paywall in
 * the middleware never arrives as a surprise. Silent for admins, for paid
 * accounts, and everywhere outside the product itself.
 */
export function TrialNotice() {
  const pathname = usePathname();
  const { isAdmin, createdAt, entitlement } = useCurrentUserAccess();

  if (!createdAt || isAdmin || hasActivePlan(entitlement)) return null;
  if (!pathname || !isPaywalledPath(pathname)) return null;

  const daysLeft = trialDaysRemaining(createdAt);
  if (daysLeft !== 1) return null;

  return (
    <div className="px-3 pt-3 sm:px-5 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-full border-2 border-amber-400/70 bg-amber-100/70 px-4 py-2 text-center text-xs font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
          დარჩენილია 1 დღე საცდელი წვდომისთვის
        </span>
        <Link href={CHECKOUT_HREF} className="underline underline-offset-4">
          აირჩიე პაკეტი
        </Link>
      </div>
    </div>
  );
}
