import { NextResponse } from "next/server";
import { findPricingTier, isTrialTier, roleForTier } from "@/lib/landing-pricing-plans";

/**
 * Starts a payment.
 *
 * The card fields themselves are deliberately not ours: taking a card
 * number on our own form puts the whole site inside PCI DSS scope. The
 * flow is the bank's hosted checkout — we create an order, hand the
 * shopper to TBC's or BOG's payment page, and wait for their callback.
 *
 * Until merchant credentials exist there is nothing to call, so the route
 * answers with the local success page and the client decides whether it
 * may follow it (development only — see `CheckoutPage`).
 */
export async function POST(request: Request) {
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
  const role = roleForTier(tierId);
  if (!tier || !role || isTrialTier(tier.id)) {
    return NextResponse.json({ error: "unknown-tier" }, { status: 400 });
  }

  // TODO: მოთხოვნა TBC/BOG-ის მერჩანტ API-სთან, საჭიროა credentials.
  // The real call registers an order (amount, currency, order id, the
  // return URL pointing at /checkout/success) and answers with the bank's
  // hosted payment URL, which is what belongs in `redirectUrl` below.
  const orderId = `local-${tier.id}-${Date.now()}`;

  return NextResponse.json({
    orderId,
    tier: tier.id,
    role,
    /** Null until a provider is wired up: there is no bank page to send anyone to yet. */
    redirectUrl: null,
    provider: null,
  });
}
