import type { PricingRole } from "@/lib/landing-pricing-plans";

export const CHECKOUT_HREF = "/checkout";
export const CHECKOUT_SUCCESS_HREF = "/checkout/success";

export function checkoutHref(tierId: string, role: PricingRole): string {
  return `${CHECKOUT_HREF}?tier=${tierId}&role=${role}`;
}

export function checkoutSuccessHref(tierId: string, role: PricingRole): string {
  return `${CHECKOUT_SUCCESS_HREF}?tier=${tierId}&role=${role}`;
}
