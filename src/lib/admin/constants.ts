/**
 * Server-side admin password, read from the ADMIN_PASSWORD environment
 * variable. There is deliberately NO fallback value: a hardcoded default
 * ships in the source and would let anyone who reads the repo — or guesses
 * a memorable string — into the admin panel. When the variable is unset,
 * `verifyAdminPassword` rejects every attempt (see admin/auth.ts), which
 * fails closed rather than open.
 */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim() ?? "";

export const ADMIN_PASSWORD_HEADER = "x-admin-password";
