import { syncRuntimeSettingsFromStore } from "@/lib/admin/load-settings";

let bootstrapped = false;

/** Load admin JSON settings into in-memory runtime overrides (server only). */
export function ensureAdminRuntimeSettings(): void {
  if (bootstrapped) return;
  try {
    syncRuntimeSettingsFromStore();
    bootstrapped = true;
  } catch {
    // JSON store unavailable — fall back to environment variables only.
  }
}

export function refreshAdminRuntimeSettings(): void {
  try {
    syncRuntimeSettingsFromStore();
    bootstrapped = true;
  } catch {
    bootstrapped = false;
  }
}
