import { NextResponse } from "next/server";
import { enforceJsonBodyLimit } from "@/lib/request-limits";
import { createClient } from "@/utils/supabase/server";
import { findPricingTier, isTrialTier } from "@/lib/landing-pricing-plans";

/** How long each paid tier runs, in days. */
const TIER_DAYS: Record<string, number> = {
  "abit-pro": 30,
  "abit-season": 90,
  "student-pro": 30,
  "student-semester": 150,
};

/**
 * Records a completed payment on the account.
 *
 * The entitlement lives in the user's `user_metadata` — `{ plan, paidUntil }`
 * — which is what the middleware reads to lift the trial deadline. A
 * separate `subscriptions` table would hold more history; this holds the
 * one fact the paywall needs.
 *
 * TODO: call this from the bank's server-to-server callback once merchant
 * credentials exist, and verify the payment against the order id before
 * writing. Today it trusts the caller, which is only acceptable while the
 * checkout itself is a local stub.
 */
export async function POST(request: Request) {
  const tooLarge = enforceJsonBodyLimit(request);
  if (tooLarge) return tooLarge;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid-body" }, { status: 400 });
  }

  const tierId = (body as { tier?: unknown })?.tier;
  if (typeof tierId !== "string") {
    return NextResponse.json({ error: "missing-tier" }, { status: 400 });
  }

  const tier = findPricingTier(tierId);
  if (!tier || isTrialTier(tier.id)) {
    return NextResponse.json({ error: "unknown-tier" }, { status: 400 });
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json({ error: "supabase-unconfigured" }, { status: 503 });
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "not-signed-in" }, { status: 401 });
  }

  const days = TIER_DAYS[tier.id] ?? 30;
  const paidUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.auth.updateUser({
    data: { plan: tier.id, paidUntil },
  });
  if (error) {
    return NextResponse.json({ error: "update-failed" }, { status: 500 });
  }

  return NextResponse.json({ plan: tier.id, paidUntil });
}
