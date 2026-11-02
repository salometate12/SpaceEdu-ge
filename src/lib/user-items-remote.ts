/**
 * The growing lists on the account as one row per item (Supabase
 * `user_items`, RLS: own rows only; migration 007), behind the same
 * pull/upsert/remove the user store already speaks: a list goes up as its
 * changed items only, and comes back assembled into the array the modules
 * read. A list's old single `user_data` row moves here the first time it's
 * pulled. Lists whose items have no id stay whole in `user_data`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RemoteRow } from "./user-store";

/** Rows per request (Supabase returns at most 1000 a query). */
const PAGE = 1000;
const CHUNK = 200;

export interface ItemRow {
  collection: string;
  item_id: string;
  position: number;
  data: unknown;
  updated_at: string;
}

/** A list as `{ id, data, position }` rows (position counted from the end, so new items first leave the rest alone); null when it can't be split. */
export function splitItems(value: unknown): { id: string; data: unknown; position: number }[] | null {
  if (!Array.isArray(value)) return null;
  const items: { id: string; data: unknown; position: number }[] = [];
  const seen = new Set<string>();
  for (const [index, item] of value.entries()) {
    const raw = item && typeof item === "object" ? (item as { id?: unknown }).id : undefined;
    if ((typeof raw !== "string" && typeof raw !== "number") || String(raw).length === 0 || String(raw).length > 200) return null;
    const id = String(raw);
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({ id, data: item, position: value.length - 1 - index });
  }
  return items;
}

/** A short fingerprint of an item and its place, to send only what changed. */
export function itemHash(data: unknown, position: number): string {
  const text = `${position}|${JSON.stringify(data)}`;
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) + hash + text.charCodeAt(index)) | 0;
  return `${hash >>> 0}:${text.length}`;
}

/** The list's „updated at“: its newest row, nudged by how many rows there are, so a removal shows too. */
export function collectionStamp(updatedAt: string[], count: number): string {
  const newest = Math.max(0, ...updatedAt.map((value) => Date.parse(value) || 0));
  return new Date(newest + count).toISOString();
}

/** Rows grouped back into lists, in their order. */
export function assemble(rows: ItemRow[]): Map<string, { value: unknown[]; stamp: string; hashes: Map<string, string> }> {
  const groups = new Map<string, ItemRow[]>();
  for (const row of rows) {
    const list = groups.get(row.collection) ?? [];
    list.push(row);
    groups.set(row.collection, list);
  }
  const lists = new Map<string, { value: unknown[]; stamp: string; hashes: Map<string, string> }>();
  for (const [collection, list] of groups) {
    const sorted = [...list].sort((a, b) => b.position - a.position);
    lists.set(collection, {
      value: sorted.map((row) => row.data),
      stamp: collectionStamp(
        sorted.map((row) => row.updated_at),
        sorted.length,
      ),
      hashes: new Map(sorted.map((row) => [row.item_id, itemHash(row.data, row.position)])),
    });
  }
  return lists;
}

/** The table isn't there (migration 007 not run yet): lists stay whole in user_data, as before. */
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && (error.code === "PGRST205" || error.code === "42P01" || /user_items/.test(error.message ?? "")));
}

export function itemRowsRemote(client: SupabaseClient, userId: string) {
  /** What the account has of each list, as fingerprints: what's sent next is only what differs. */
  const known = new Map<string, Map<string, string>>();
  let available = true;

  async function pullAll(): Promise<ItemRow[]> {
    const rows: ItemRow[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await client
        .from("user_items")
        .select("collection, item_id, position, data, updated_at")
        .eq("user_id", userId)
        .order("collection")
        .order("item_id")
        .range(from, from + PAGE - 1);
      if (isMissingTable(error)) {
        available = false;
        return [];
      }
      if (error) throw error;
      rows.push(...((data ?? []) as ItemRow[]));
      if (!data || data.length < PAGE) return rows;
    }
  }

  async function stampOf(collection: string): Promise<string> {
    const { data, count, error } = await client
      .from("user_items")
      .select("updated_at", { count: "exact" })
      .eq("user_id", userId)
      .eq("collection", collection)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    return collectionStamp(
      (data ?? []).map((row: { updated_at: string }) => row.updated_at),
      count ?? 0,
    );
  }

  return {
    /** False when the table isn't there: everything stays in user_data. */
    get available() {
      return available;
    },

    /** Every list on the account, assembled (fingerprints remembered). */
    async pull(): Promise<Map<string, RemoteRow>> {
      const lists = assemble(await pullAll());
      const result = new Map<string, RemoteRow>();
      for (const [collection, list] of lists) {
        known.set(collection, list.hashes);
        result.set(collection, { key: collection, value: list.value, updated_at: list.stamp });
      }
      return result;
    },

    /** Sends a list's changed items and removes the ones gone; null when it can't be split into items. */
    async push(key: string, value: unknown): Promise<RemoteRow | null> {
      if (!available) return null;
      const items = splitItems(value);
      if (!items) return null;
      const before = known.get(key) ?? new Map<string, string>();
      const after = new Map(items.map((item) => [item.id, itemHash(item.data, item.position)]));
      const changed = items.filter((item) => before.get(item.id) !== after.get(item.id));
      const gone = [...before.keys()].filter((id) => !after.has(id));
      for (let index = 0; index < changed.length; index += CHUNK) {
        const { error } = await client.from("user_items").upsert(
          changed.slice(index, index + CHUNK).map((item) => ({ user_id: userId, collection: key, item_id: item.id, position: item.position, data: item.data })),
          { onConflict: "user_id,collection,item_id" },
        );
        if (error) throw error;
      }
      for (let index = 0; index < gone.length; index += CHUNK) {
        const { error } = await client.from("user_items").delete().eq("user_id", userId).eq("collection", key).in("item_id", gone.slice(index, index + CHUNK));
        if (error) throw error;
      }
      known.set(key, after);
      return { key, value, updated_at: await stampOf(key) };
    },

    async remove(keys: string[]): Promise<void> {
      if (keys.length === 0 || !available) return;
      const { error } = await client.from("user_items").delete().eq("user_id", userId).in("collection", keys);
      if (error) throw error;
      keys.forEach((key) => known.delete(key));
    },
  };
}
