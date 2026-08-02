/** Server-side admin password. Override with ADMIN_PASSWORD in .env.local. */
export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ?? "SpaceEdu@Admin2026";

export const ADMIN_PASSWORD_HEADER = "x-admin-password";
