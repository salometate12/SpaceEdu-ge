/**
 * The browser's user store (lib/user-store) on window.localStorage, and its
 * connection to the account's rows in Supabase (`user_data`, RLS: own rows
 * only). Modules write synced keys through `userStore.set` instead of
 * localStorage, so the change also reaches the account.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { SYNCED_KEYS, USER_DATA_REMOTE_EVENT } from "./user-data-keys";
import { createUserStore, specFor, type KeyValueStorage, type RemoteRow, type UserDataRemote, type UserStore } from "./user-store";
import { itemRowsRemote } from "./user-items-remote";

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

/**
 * The account's rows in Supabase: `user_data` (one row per key), and for
 * the growing lists (`rows: true` in SYNCED_KEYS) one `user_items` row per
 * item (lib/user-items-remote), assembled back into the list. A list still
 * in its old single row moves to items the first time it's pulled.
 */
export function supabaseUserData(client: SupabaseClient, userId: string): UserDataRemote {
  const items = itemRowsRemote(client, userId);
  const isList = (key: string) => Boolean(specFor(SYNCED_KEYS, key)?.rows);

  async function upsertRows(rows: { key: string; value: unknown }[]): Promise<RemoteRow[]> {
    if (rows.length === 0) return [];
    const { data, error } = await client
      .from("user_data")
      .upsert(rows.map((row) => ({ user_id: userId, key: row.key, value: row.value })), { onConflict: "user_id,key" })
      .select("key, value, updated_at");
    if (error) throw error;
    return (data ?? []) as RemoteRow[];
  }

  async function removeRows(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    const { error } = await client.from("user_data").delete().eq("user_id", userId).in("key", keys);
    if (error) throw error;
  }

  return {
    async pull() {
      const { data, error } = await client.from("user_data").select("key, value, updated_at").eq("user_id", userId);
      if (error) throw error;
      const rows = (data ?? []) as RemoteRow[];
      const lists = await items.pull();
      const result: RemoteRow[] = [];
      const moved: string[] = [];
      for (const row of rows) {
        if (!items.available || !isList(row.key)) {
          result.push(row);
          continue;
        }
        // Already in items: the old row is left over.
        if (lists.has(row.key)) {
          moved.push(row.key);
          continue;
        }
        // Still a single row: moved to items now.
        const pushed = await items.push(row.key, row.value);
        if (pushed) {
          lists.set(row.key, pushed);
          moved.push(row.key);
        } else {
          result.push(row);
        }
      }
      await removeRows(moved);
      return [...result, ...lists.values()];
    },
    async upsert(rows) {
      const whole: { key: string; value: unknown }[] = [];
      const result: RemoteRow[] = [];
      for (const row of rows) {
        const pushed = isList(row.key) ? await items.push(row.key, row.value) : null;
        if (pushed) result.push(pushed);
        else whole.push(row);
      }
      return [...result, ...(await upsertRows(whole))];
    },
    async remove(keys) {
      await items.remove(keys.filter(isList));
      await removeRows(keys);
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
