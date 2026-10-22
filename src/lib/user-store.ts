/**
 * The user's data on their account, not just in this browser.
 *
 * localStorage stays the fast local copy (and what works offline); the
 * account's `user_data` table in Supabase is the source of truth. Reads are
 * instant from the local copy; writes go there at once and to the server
 * ~1s later. Changes made offline wait (the queue survives a reload) and
 * are sent when the connection is back.
 *
 * Pure apart from what's injected (storage, remote, clock), so the whole
 * flow is testable without a browser. lib/user-data.ts wires it to
 * window.localStorage and Supabase.
 */

/** The bits of the Web Storage API the store uses. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

export interface MergeContext {
  /** When the local copy was last changed (ms), 0 if it predates syncing. */
  localAt: number;
  /** When the server copy was last changed (ms). */
  remoteAt: number;
}

/** Combines the local and server copies when both changed. */
export type Merge = (local: unknown, remote: unknown, context: MergeContext) => unknown;

/** A localStorage key that follows the account. */
export interface SyncSpec {
  key: string;
  /** Also matches `key:<anything>` (e.g. a per-space variant). */
  variants?: boolean;
  /** Default: the newer copy wins. */
  merge?: Merge;
  /** Window event that makes the UI re-read this key. */
  event?: string;
}

export interface RemoteRow {
  key: string;
  value: unknown;
  updated_at: string;
}

/** The account's rows; lib/user-data.ts implements it with Supabase. */
export interface UserDataRemote {
  pull(): Promise<RemoteRow[]>;
  upsert(rows: { key: string; value: unknown }[]): Promise<RemoteRow[]>;
  remove(keys: string[]): Promise<void>;
}

export type SyncStatus =
  /** Not signed in: data stays on this device. */
  | "local"
  | "syncing"
  | "synced"
  /** Changes are waiting for the connection. */
  | "offline"
  | "error";

/** Per-device bookkeeping, kept next to the data. */
export const SYNC_META_KEY = "spaceedu-sync-meta";
/** Largest value sent to the server (the table enforces the same). */
export const MAX_VALUE_BYTES = 1024 * 1024;

interface SyncMeta {
  /** The account the local copy belongs to. */
  owner: string | null;
  /** Server `updated_at` of each key as of the last sync on this device. */
  synced: Record<string, string>;
  /** Keys changed locally and not yet on the server: when, and a counter so
   * a change made during an upload isn't lost. */
  dirty: Record<string, { at: number; n: number }>;
}

/** The newer copy wins. */
export const newerWins: Merge = (local, remote, { localAt, remoteAt }) =>
  localAt > remoteAt ? local : remote;

/** Lists of `{ id }`: both sides' items, the local version of a shared id. */
export const unionById: Merge = (local, remote) => {
  if (!Array.isArray(local) || !Array.isArray(remote)) return newerWins(local, remote, { localAt: 0, remoteAt: 1 });
  const ids = new Set(local.map((item) => (item as { id?: unknown })?.id));
  return [...local, ...remote.filter((item) => !ids.has((item as { id?: unknown })?.id))];
};

export function specFor(specs: SyncSpec[], key: string): SyncSpec | undefined {
  return specs.find((spec) => key === spec.key || (spec.variants && key.startsWith(`${spec.key}:`)));
}

function parse(raw: string | null): { ok: true; value: unknown } | { ok: false } {
  if (raw === null) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

export function createUserStore({
  storage,
  specs,
  debounceMs = 1000,
  now = () => Date.now(),
  isOnline = () => true,
  emit,
}: {
  storage: KeyValueStorage;
  specs: SyncSpec[];
  debounceMs?: number;
  now?: () => number;
  isOnline?: () => boolean;
  /** Called with each key whose value changed from the server. */
  emit?: (key: string, spec: SyncSpec | undefined) => void;
}) {
  const listeners = new Map<string, Set<() => void>>();
  const statusListeners = new Set<() => void>();
  let remote: UserDataRemote | null = null;
  let status: SyncStatus = "local";
  let timer: ReturnType<typeof setTimeout> | null = null;
  let counter = 0;
  // One server round-trip at a time.
  let queue: Promise<void> = Promise.resolve();

  const readMeta = (): SyncMeta => {
    const parsed = parse(storage.getItem(SYNC_META_KEY));
    const meta = parsed.ok ? (parsed.value as Partial<SyncMeta>) : {};
    return { owner: meta.owner ?? null, synced: meta.synced ?? {}, dirty: meta.dirty ?? {} };
  };
  const writeMeta = (meta: SyncMeta) => storage.setItem(SYNC_META_KEY, JSON.stringify(meta));

  const setStatus = (next: SyncStatus) => {
    if (next === status) return;
    status = next;
    statusListeners.forEach((listener) => listener());
  };

  const changed = (key: string) => {
    listeners.get(key)?.forEach((listener) => listener());
  };

  /** Local keys that sync. */
  const localKeys = (): string[] => {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && specFor(specs, key)) keys.push(key);
    }
    return keys;
  };

  const markDirty = (key: string) => {
    if (!specFor(specs, key)) return;
    const meta = readMeta();
    counter += 1;
    meta.dirty[key] = { at: now(), n: counter };
    writeMeta(meta);
    schedule();
  };

  const schedule = () => {
    if (!remote) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, debounceMs);
  };

  /** Writes a server value into the local copy and tells the UI. */
  const applyRemote = (key: string, value: unknown) => {
    const raw = JSON.stringify(value);
    if (storage.getItem(key) === raw) return;
    storage.setItem(key, raw);
    changed(key);
    emit?.(key, specFor(specs, key));
  };

  const removeLocal = (key: string) => {
    if (storage.getItem(key) === null) return;
    storage.removeItem(key);
    changed(key);
    emit?.(key, specFor(specs, key));
  };

  /** Sends every local change to the server. */
  const push = async () => {
    if (!remote) return;
    const sent = { ...readMeta().dirty };
    const keys = Object.keys(sent);
    if (keys.length === 0) {
      setStatus("synced");
      return;
    }
    // Known offline: don't wait for a request to fail, keep the queue.
    if (!isOnline()) {
      setStatus("offline");
      return;
    }
    const upserts: { key: string; value: unknown }[] = [];
    const removals: string[] = [];
    for (const key of keys) {
      const raw = storage.getItem(key);
      if (raw === null) {
        removals.push(key);
        continue;
      }
      const parsed = parse(raw);
      // Not JSON, or too big for one row: stays on this device only.
      if (parsed.ok && raw.length <= MAX_VALUE_BYTES) upserts.push({ key, value: parsed.value });
    }
    setStatus("syncing");
    try {
      const rows = upserts.length ? await remote.upsert(upserts) : [];
      if (removals.length) await remote.remove(removals);
      const meta = readMeta();
      for (const row of rows) meta.synced[row.key] = row.updated_at;
      for (const key of removals) delete meta.synced[key];
      for (const key of keys) {
        // Changed again while uploading: stays queued.
        if (meta.dirty[key]?.n === sent[key].n) delete meta.dirty[key];
      }
      writeMeta(meta);
      const pending = Object.keys(meta.dirty).length > 0;
      setStatus(pending ? "syncing" : "synced");
      if (pending) schedule();
    } catch {
      setStatus(isOnline() ? "error" : "offline");
    }
  };

  /** Brings the server's copy in and reconciles it with the local one. */
  const pull = async (userId: string) => {
    if (!remote) return;
    let meta = readMeta();
    if (meta.owner && meta.owner !== userId) {
      // Someone else's data on this device: never show or upload it.
      for (const key of localKeys()) removeLocal(key);
      meta = { owner: null, synced: {}, dirty: {} };
    }
    meta.owner = userId;
    writeMeta(meta);
    if (!isOnline()) {
      setStatus("offline");
      return;
    }
    setStatus("syncing");

    let rows: RemoteRow[];
    try {
      rows = await remote.pull();
    } catch {
      setStatus(isOnline() ? "error" : "offline");
      return;
    }
    const remoteRows = new Map(rows.filter((row) => specFor(specs, row.key)).map((row) => [row.key, row]));
    const keys = new Set([...localKeys(), ...remoteRows.keys(), ...Object.keys(meta.dirty)]);

    for (const key of keys) {
      const spec = specFor(specs, key);
      if (!spec) continue;
      const merge = spec.merge ?? newerWins;
      const row = remoteRows.get(key);
      const raw = storage.getItem(key);
      const local = parse(raw);
      const dirty = meta.dirty[key];
      const known = key in meta.synced;

      if (row && local.ok) {
        const remoteChanged = !known || meta.synced[key] !== row.updated_at;
        if (remoteChanged && (dirty || !known)) {
          // Both sides have it: first sync on this device, or both changed.
          const merged = merge(local.value, row.value, {
            localAt: dirty?.at ?? 0,
            remoteAt: Date.parse(row.updated_at) || 0,
          });
          applyRemote(key, merged);
          if (JSON.stringify(merged) !== JSON.stringify(row.value)) {
            counter += 1;
            meta.dirty[key] = { at: now(), n: counter };
          } else {
            delete meta.dirty[key];
          }
        } else if (remoteChanged) {
          applyRemote(key, row.value);
        }
        meta.synced[key] = row.updated_at;
      } else if (row) {
        // Only on the server, or deleted here and not yet sent.
        if (!(dirty && meta.synced[key] === row.updated_at)) {
          applyRemote(key, row.value);
          delete meta.dirty[key];
        }
        meta.synced[key] = row.updated_at;
      } else if (raw !== null) {
        if (known && !dirty) {
          // Deleted on another device.
          removeLocal(key);
          delete meta.synced[key];
        } else {
          // Only here: upload it (this is also the first-time migration).
          counter += 1;
          meta.dirty[key] = dirty ?? { at: 0, n: counter };
        }
      } else {
        delete meta.dirty[key];
        delete meta.synced[key];
      }
    }
    writeMeta(meta);
    await push();
  };

  const run = (task: () => Promise<void>) => {
    queue = queue.then(task, task);
    return queue;
  };

  const flush = () => run(push);

  return {
    get<T>(key: string, fallback: T): T {
      const parsed = parse(storage.getItem(key));
      return parsed.ok ? (parsed.value as T) : fallback;
    },
    set(key: string, value: unknown) {
      const raw = JSON.stringify(value);
      if (storage.getItem(key) === raw) return;
      storage.setItem(key, raw);
      changed(key);
      markDirty(key);
    },
    remove(key: string) {
      if (storage.getItem(key) === null) return;
      storage.removeItem(key);
      changed(key);
      markDirty(key);
    },
    /** Called when `key` changes, here or from the server. */
    subscribe(key: string, listener: () => void) {
      let set = listeners.get(key);
      if (!set) listeners.set(key, (set = new Set()));
      set.add(listener);
      return () => set.delete(listener);
    },
    status: () => status,
    subscribeStatus(listener: () => void) {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    /** Signed in: pull the account's data, upload what's only here. */
    connect(userId: string, connection: UserDataRemote) {
      remote = connection;
      return run(() => pull(userId));
    },
    /** Re-reads the server (on focus, when back online). */
    refresh() {
      const owner = readMeta().owner;
      if (!remote || !owner) return Promise.resolve();
      return run(() => pull(owner));
    },
    flush,
    /** Signed out: stop syncing and drop the account's data from this device. */
    disconnect() {
      if (timer) clearTimeout(timer);
      timer = null;
      remote = null;
      if (readMeta().owner) {
        for (const key of localKeys()) removeLocal(key);
        storage.removeItem(SYNC_META_KEY);
      }
      setStatus("local");
    },
    /** Not signed in (e.g. the dev bypass): local only, as before. */
    detach() {
      if (timer) clearTimeout(timer);
      timer = null;
      remote = null;
      setStatus("local");
    },
  };
}

export type UserStore = ReturnType<typeof createUserStore>;
