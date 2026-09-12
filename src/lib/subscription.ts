/**
 * Trial deadline and paid entitlement.
 *
 * A new account gets three days of everything, counted from Supabase's own
 * `user.created_at` — there is no separate trial record to keep in sync.
 * After that the product routes are behind the paywall until the account
 * carries an entitlement, which a completed payment writes into the user's
 * `user_metadata`.
 *
 * Admins (see `ADMIN_EMAILS`) are outside all of this.
 */

export const TRIAL_DAYS = 3;
export const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

export const PAYWALL_REASON_PARAM = "reason";
export const TRIAL_EXPIRED_REASON = "trial-expired";

export interface Entitlement {
  /** Pricing tier id, e.g. "abit-pro". */
  plan: string | null;
  /** ISO date the plan runs out; null means no paid plan. */
  paidUntil: string | null;
}

export function readEntitlement(
  metadata: Record<string, unknown> | undefined | null,
): Entitlement {
  const plan = typeof metadata?.plan === "string" ? metadata.plan : null;
  const paidUntil = typeof metadata?.paidUntil === "string" ? metadata.paidUntil : null;
  return { plan, paidUntil };
}

export function hasActivePlan(entitlement: Entitlement, now: number = Date.now()): boolean {
  if (!entitlement.paidUntil) return false;
  const until = Date.parse(entitlement.paidUntil);
  return Number.isFinite(until) && until > now;
}

/** Milliseconds left of the free trial; 0 once it has run out. */
export function trialMsRemaining(
  createdAt: string | null | undefined,
  now: number = Date.now(),
): number {
  if (!createdAt) return TRIAL_MS;
  const started = Date.parse(createdAt);
  if (!Number.isFinite(started)) return TRIAL_MS;
  return Math.max(0, started + TRIAL_MS - now);
}

/** Days left, rounded up, so the last hours still read as "1 დღე". */
export function trialDaysRemaining(
  createdAt: string | null | undefined,
  now: number = Date.now(),
): number {
  return Math.ceil(trialMsRemaining(createdAt, now) / (24 * 60 * 60 * 1000));
}

export function isTrialExpired(
  createdAt: string | null | undefined,
  now: number = Date.now(),
): boolean {
  return trialMsRemaining(createdAt, now) === 0;
}

/**
 * The product itself — everything the trial and the paywall cover.
 *
 * Deliberately a prefix list rather than `SPACE_GUARDED_ROUTES`: that one
 * answers "which space owns this page", which is a narrower question. The
 * marketing pages, the auth flow, /checkout and the API are absent on
 * purpose — locking those would leave an expired account with nowhere to
 * go and no way to pay.
 */
const PAYWALLED_PREFIXES = [
  "/dashboard",
  "/dashboard-abit",
  "/dashboard-student",
  "/school",
  "/university",
  "/study-plan",
  "/quiz",
  "/ai-teacher",
  "/syllabus",
  "/presentation",
  "/cv",
  "/journal",
  "/lecture-notes",
  "/conspectus",
  "/eli5",
  "/deck",
  "/exam",
  "/exam-calculator",
  "/generate",
  "/research-platform",
  "/subject",
  "/profile",
  "/profile-abiturient",
  "/notifications",
];

/**
 * Whether the paywall is switched on at all.
 *
 * Off by default, and turned on only when `PAYWALL_ENABLED` is exactly
 * "true". The trial and the checkout redirect exist in code, but there is
 * no live payment provider yet — so shipping with them on would send every
 * trial-expired user to a checkout that cannot take money and strand them.
 * Launch with this unset; flip it to "true" in the environment once the
 * bank integration is live, with no code change.
 */
export function isPaywallEnabled(): boolean {
  return process.env.PAYWALL_ENABLED === "true";
}

export function isPaywalledPath(pathname: string): boolean {
  return PAYWALLED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
