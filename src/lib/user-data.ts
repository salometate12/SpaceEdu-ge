/**
 * The browser's user store (lib/user-store) on window.localStorage, and its
 * connection to the account's rows in Supabase (`user_data`, RLS: own rows
 * only). Modules write synced keys through `userStore.set` instead of
 * localStorage, so the change also reaches the account.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { SYNCED_KEYS, USER_DATA_REMOTE_EVENT } from "./user-data-keys";
import { createUserStore, type KeyValueStorage, type RemoteRow, type UserDataRemote, type UserStore } from "./user-store";

/** Server rendering (and tests) get a store that keeps nothing. */
const memoryStorage = (): KeyValueStorage => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
};

let store: UserStore | null = null;

function browserStorage(): KeyValueStorage {
  try {
    return window.localStorage;
  } catch {
    // Storage blocked (e.g. some private modes): works for this visit only.
    return memoryStorage();
  }
}

export function getUserStore(): UserStore {
  if (store) return store;
  if (typeof window === "undefined") return createUserStore({ storage: memoryStorage(), specs: SYNCED_KEYS });
  store = createUserStore({
    storage: browserStorage(),
    specs: SYNCED_KEYS,
    isOnline: () => navigator.onLine,
    // Values from the server: the same events the modules fire on a local change.
    emit: (key, spec) => {
      if (spec?.event) window.dispatchEvent(new Event(spec.event));
      window.dispatchEvent(new CustomEvent(USER_DATA_REMOTE_EVENT, { detail: { key } }));
    },
  });
  return store;
}

/** Shorthand used by the modules. */
export const userStore = {
  get: <T,>(key: string, fallback: T) => getUserStore().get<T>(key, fallback),
  set: (key: string, value: unknown) => getUserStore().set(key, value),
  remove: (key: string) => getUserStore().remove(key),
  subscribe: (key: string, listener: () => void) => getUserStore().subscribe(key, listener),
};

/** The account's rows in Supabase. */
export function supabaseUserData(client: SupabaseClient, userId: string): UserDataRemote {
  return {
    async pull() {
      const { data, error } = await client.from("user_data").select("key, value, updated_at").eq("user_id", userId);
      if (error) throw error;
      return (data ?? []) as RemoteRow[];
    },
    async upsert(rows) {
      const { data, error } = await client
        .from("user_data")
        .upsert(rows.map((row) => ({ user_id: userId, key: row.key, value: row.value })), { onConflict: "user_id,key" })
        .select("key, value, updated_at");
      if (error) throw error;
      return (data ?? []) as RemoteRow[];
    },
    async remove(keys) {
      const { error } = await client.from("user_data").delete().eq("user_id", userId).in("key", keys);
      if (error) throw error;
    },
  };
}

/** Calls `listener` when a value for one of `keys` (or a key starting with a
 * prefix ending in ":") arrives from the account. */
export function onRemoteUserData(match: (key: string) => boolean, listener: () => void): () => void {
  const handler = (event: Event) => {
    const key = (event as CustomEvent<{ key?: string }>).detail?.key;
    if (key && match(key)) listener();
  };
  window.addEventListener(USER_DATA_REMOTE_EVENT, handler);
  return () => window.removeEventListener(USER_DATA_REMOTE_EVENT, handler);
}
