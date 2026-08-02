import { defaultSettingsStore } from "./default-stores";
import { ensureAdminStore, readAdminStore, writeAdminStore, clearAdminStoreCache } from "./json-store";
import { applyRuntimeAiSettings } from "./runtime-overrides";
import type { AdminSettings } from "./types";

const STORE = "settings";

export function loadAdminSettings(): AdminSettings {
  ensureAdminStore(STORE, defaultSettingsStore());
  return readAdminStore(STORE, defaultSettingsStore());
}

export function saveAdminSettings(data: AdminSettings): void {
  writeAdminStore(STORE, {
    ...data,
    meta: { updatedAt: new Date().toISOString() },
  });
}

export function clearAdminSettingsCache(): void {
  clearAdminStoreCache(STORE);
}

export function syncRuntimeSettingsFromStore(): AdminSettings {
  const settings = loadAdminSettings();
  applyRuntimeAiSettings(settings.ai);
  return settings;
}
