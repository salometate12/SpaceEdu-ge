import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseUserData } from "./user-data";
import { CUSTOM_DECKS_STORAGE_KEY, STREAK_KEY } from "./user-data-keys";

type Row = Record<string, unknown>;

/** Just enough of the Supabase query builder for user_data and user_items, kept in memory. */
function fakeSupabase({ itemsTable = true } = {}) {
  const tables: Record<string, Row[]> = { user_data: [], user_items: [] };
  const writes: { table: string; op: string; count: number }[] = [];
  let clock = Date.parse("2026-11-01T00:00:00.000Z");
  const stamp = () => new Date((clock += 1000)).toISOString();

  function query(table: string) {
    const filters: ((row: Row) => boolean)[] = [];
    let op: "select" | "upsert" | "delete" = "select";
    let payload: Row[] = [];
    let conflict: string[] = [];
    let range: [number, number] | null = null;
    let limit: number | null = null;
    let order: string | null = null;
    let descending = false;
    let counted = false;
    const builder = {
      select(_cols?: string, options?: { count?: string }) {
        counted = Boolean(options?.count);
        return builder;
      },
      upsert(rows: Row[], options: { onConflict: string }) {
        op = "upsert";
        payload = rows;
        conflict = options.onConflict.split(",");
        return builder;
      },
      delete() {
        op = "delete";
        return builder;
      },
      eq(column: string, value: unknown) {
        filters.push((row) => row[column] === value);
        return builder;
      },
      in(column: string, values: unknown[]) {
        filters.push((row) => values.includes(row[column]));
        return builder;
      },
      order(column: string, options?: { ascending?: boolean }) {
        order = column;
        descending = options?.ascending === false;
        return builder;
      },
      range(from: number, to: number) {
        range = [from, to];
        return builder;
      },
      limit(value: number) {
        limit = value;
        return builder;
      },
      then(resolve: (value: unknown) => void) {
        if (table === "user_items" && !itemsTable) {
          resolve({ data: null, error: { code: "PGRST205", message: "Could not find the table 'public.user_items'" } });
          return;
        }
        const rows = tables[table];
        if (op === "upsert") {
          writes.push({ table, op, count: payload.length });
          const saved = payload.map((incoming) => {
            const at = stamp();
            const index = rows.findIndex((row) => conflict.every((column) => row[column] === incoming[column]));
            const next = { ...incoming, updated_at: at };
            if (index >= 0) rows[index] = next;
            else rows.push(next);
            return next;
          });
          resolve({ data: saved, error: null });
          return;
        }
        let matched = rows.filter((row) => filters.every((filter) => filter(row)));
        if (op === "delete") {
          writes.push({ table, op, count: matched.length });
          tables[table] = rows.filter((row) => !matched.includes(row));
          resolve({ data: null, error: null });
          return;
        }
        const count = matched.length;
        if (order) matched = [...matched].sort((a, b) => String(a[order!]).localeCompare(String(b[order!])) * (descending ? -1 : 1));
        if (range) matched = matched.slice(range[0], range[1] + 1);
        if (limit !== null) matched = matched.slice(0, limit);
        resolve({ data: matched, error: null, ...(counted ? { count } : {}) });
      },
    };
    return builder;
  }

  return { client: { from: query } as unknown as SupabaseClient, tables, writes };
}

const deck = (id: string, title = id) => ({ id, title, cards: [], updatedAt: 1 });

describe("the account's rows", () => {
  it("moves a list still in one user_data row to one row per item, in order", async () => {
    const fake = fakeSupabase();
    fake.tables.user_data.push(
      { user_id: "u", key: CUSTOM_DECKS_STORAGE_KEY, value: [deck("b"), deck("a")], updated_at: "2026-10-01T00:00:00.000Z" },
      { user_id: "u", key: STREAK_KEY, value: { activityDates: ["2026-10-31"] }, updated_at: "2026-10-01T00:00:00.000Z" },
    );
    const rows = await supabaseUserData(fake.client, "u").pull();
    expect(rows.find((row) => row.key === CUSTOM_DECKS_STORAGE_KEY)?.value).toEqual([deck("b"), deck("a")]);
    expect(rows.find((row) => row.key === STREAK_KEY)?.value).toEqual({ activityDates: ["2026-10-31"] });
    expect(fake.tables.user_items.map((row) => row.item_id)).toEqual(["b", "a"]);
    // The old row is gone; the small key stays where it was.
    expect(fake.tables.user_data.map((row) => row.key)).toEqual([STREAK_KEY]);
  });

  it("sends only the items that changed, and removes the ones gone", async () => {
    const fake = fakeSupabase();
    const remote = supabaseUserData(fake.client, "u");
    await remote.upsert([{ key: CUSTOM_DECKS_STORAGE_KEY, value: [deck("b"), deck("a")] }]);
    fake.writes.length = 0;
    await remote.upsert([{ key: CUSTOM_DECKS_STORAGE_KEY, value: [deck("c"), deck("b", "renamed")] }]);
    expect(fake.writes).toEqual([
      { table: "user_items", op: "upsert", count: 2 },
      { table: "user_items", op: "delete", count: 1 },
    ]);
    const pulled = await supabaseUserData(fake.client, "u").pull();
    expect(pulled.find((row) => row.key === CUSTOM_DECKS_STORAGE_KEY)?.value).toEqual([deck("c"), deck("b", "renamed")]);
  });

  it("before migration 007 runs, keeps every list whole in user_data as before", async () => {
    const fake = fakeSupabase({ itemsTable: false });
    const remote = supabaseUserData(fake.client, "u");
    await remote.pull();
    await remote.upsert([{ key: CUSTOM_DECKS_STORAGE_KEY, value: [deck("a")] }]);
    expect(fake.tables.user_data.map((row) => row.key)).toEqual([CUSTOM_DECKS_STORAGE_KEY]);
  });
});
