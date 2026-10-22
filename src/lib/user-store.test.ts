import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SYNC_META_KEY,
  createUserStore,
  unionById,
  type KeyValueStorage,
  type RemoteRow,
  type SyncSpec,
  type UserDataRemote,
} from "./user-store";
import { mergeSemesterSubjects, mergeStudyPlan, SYNCED_KEYS } from "./user-data-keys";

function memoryStorage(initial: Record<string, unknown> = {}): KeyValueStorage & { dump(): Record<string, string> } {
  const map = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
    dump: () => Object.fromEntries(map),
  };
}

/** The account's rows, with the server's clock (one tick per write). */
function fakeRemote(initial: Record<string, unknown> = {}) {
  let clock = Date.parse("2026-10-01T00:00:00Z");
  const stamp = () => new Date((clock += 1000)).toISOString();
  const rows = new Map<string, RemoteRow>(
    Object.entries(initial).map(([key, value]) => [key, { key, value, updated_at: stamp() }]),
  );
  const remote = {
    rows,
    offline: false,
    upserts: 0,
    pull: vi.fn(async () => {
      if (remote.offline) throw new Error("offline");
      return [...rows.values()].map((row) => ({ ...row }));
    }),
    upsert: vi.fn(async (items: { key: string; value: unknown }[]) => {
      if (remote.offline) throw new Error("offline");
      remote.upserts += 1;
      return items.map(({ key, value }) => {
        const row = { key, value: structuredClone(value), updated_at: stamp() };
        rows.set(key, row);
        return { ...row };
      });
    }),
    remove: vi.fn(async (keys: string[]) => {
      if (remote.offline) throw new Error("offline");
      keys.forEach((key) => rows.delete(key));
    }),
    /** Another device writes. */
    write(key: string, value: unknown) {
      rows.set(key, { key, value, updated_at: stamp() });
    },
  };
  return remote satisfies UserDataRemote & Record<string, unknown>;
}

const specs: SyncSpec[] = [
  { key: "list", merge: unionById, event: "list-updated" },
  { key: "plan" },
  { key: "calendar", variants: true, merge: unionById },
];

function setup(storage = memoryStorage(), online = { value: true }) {
  let time = Date.parse("2026-10-10T00:00:00Z");
  const emitted: string[] = [];
  const store = createUserStore({
    storage,
    specs,
    now: () => (time += 1000),
    isOnline: () => online.value,
    emit: (key) => emitted.push(key),
  });
  return { store, storage, emitted, online };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("get / set / subscribe", () => {
  it("reads and writes the local copy at once and tells subscribers", () => {
    const { store, storage } = setup();
    const listener = vi.fn();
    store.subscribe("list", listener);
    expect(store.get("list", [])).toEqual([]);
    store.set("list", [{ id: 1 }]);
    expect(JSON.parse(storage.getItem("list")!)).toEqual([{ id: 1 }]);
    expect(store.get("list", [])).toEqual([{ id: 1 }]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps working signed out, without a server", async () => {
    const { store } = setup();
    store.set("plan", { a: 1 });
    await vi.runAllTimersAsync();
    expect(store.status()).toBe("local");
    expect(store.get("plan", null)).toEqual({ a: 1 });
  });
});

describe("sending changes", () => {
  it("debounces: several quick changes are one upload, ~1s later", async () => {
    const { store } = setup();
    const remote = fakeRemote();
    await store.connect("u1", remote);
    store.set("list", [{ id: 1 }]);
    store.set("list", [{ id: 1 }, { id: 2 }]);
    store.set("plan", { day: 3 });
    await vi.advanceTimersByTimeAsync(900);
    expect(remote.upsert).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(200);
    expect(remote.upsert).toHaveBeenCalledTimes(1);
    expect(remote.rows.get("list")!.value).toEqual([{ id: 1 }, { id: 2 }]);
    expect(remote.rows.get("plan")!.value).toEqual({ day: 3 });
    expect(store.status()).toBe("synced");
  });

  it("queues changes made offline and sends them when the connection is back", async () => {
    const online = { value: true };
    const { store, storage } = setup(memoryStorage(), online);
    const remote = fakeRemote();
    await store.connect("u1", remote);
    online.value = false;
    remote.offline = true;
    store.set("plan", { day: 4 });
    await vi.advanceTimersByTimeAsync(1100);
    expect(store.status()).toBe("offline");
    // The queue survives a reload: it's in the device's own storage.
    expect(Object.keys(JSON.parse(storage.getItem(SYNC_META_KEY)!).dirty)).toEqual(["plan"]);

    online.value = true;
    remote.offline = false;
    await store.refresh();
    expect(remote.rows.get("plan")!.value).toEqual({ day: 4 });
    expect(store.status()).toBe("synced");
  });

  it("says offline at once when the browser knows it is, without a request", async () => {
    const online = { value: true };
    const { store } = setup(memoryStorage(), online);
    const remote = fakeRemote();
    await store.connect("u1", remote);
    online.value = false;
    store.set("plan", { day: 5 });
    await vi.advanceTimersByTimeAsync(1100);
    await store.refresh();
    expect(store.status()).toBe("offline");
    expect(remote.upsert).not.toHaveBeenCalled();
    expect(remote.pull).toHaveBeenCalledTimes(1);
  });

  it("sends a deletion", async () => {
    const { store } = setup();
    const remote = fakeRemote({ plan: { day: 1 } });
    await store.connect("u1", remote);
    store.remove("plan");
    await vi.advanceTimersByTimeAsync(1100);
    expect(remote.rows.has("plan")).toBe(false);
  });

  it("only syncs the listed keys", async () => {
    const { store, storage } = setup(memoryStorage({ "spaceedu-pwa-dismissed": true, list: [] }));
    const remote = fakeRemote();
    await store.connect("u1", remote);
    expect([...remote.rows.keys()]).toEqual(["list"]);
    expect(storage.getItem("spaceedu-pwa-dismissed")).toBe("true");
  });
});

describe("first sign-in with the new version (migration)", () => {
  it("uploads what was only on this device", async () => {
    const { store } = setup(memoryStorage({ list: [{ id: "a" }], "calendar:abiturient": [{ id: "e1" }] }));
    const remote = fakeRemote();
    await store.connect("u1", remote);
    expect(remote.rows.get("list")!.value).toEqual([{ id: "a" }]);
    expect(remote.rows.get("calendar:abiturient")!.value).toEqual([{ id: "e1" }]);
    expect(store.status()).toBe("synced");
  });

  it("merges when both this device and the account have data", async () => {
    const { store } = setup(memoryStorage({ list: [{ id: "a" }, { id: "b" }] }));
    const remote = fakeRemote({ list: [{ id: "b" }, { id: "c" }] });
    await store.connect("u1", remote);
    expect(store.get("list", [])).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
    expect(remote.rows.get("list")!.value).toEqual([{ id: "a" }, { id: "b" }, { id: "c" }]);
  });

  it("brings down what's only on the account and tells the UI", async () => {
    const { store, emitted } = setup();
    const remote = fakeRemote({ list: [{ id: "x" }] });
    await store.connect("u1", remote);
    expect(store.get("list", [])).toEqual([{ id: "x" }]);
    expect(emitted).toEqual(["list"]);
    expect(remote.upsert).not.toHaveBeenCalled();
  });

  it("happens once: a later sign-in doesn't upload unchanged data again", async () => {
    const { store } = setup(memoryStorage({ list: [{ id: "a" }] }));
    const remote = fakeRemote();
    await store.connect("u1", remote);
    await store.refresh();
    expect(remote.upsert).toHaveBeenCalledTimes(1);
  });
});

describe("changes from another device", () => {
  it("are picked up when nothing changed here", async () => {
    const { store } = setup();
    const remote = fakeRemote({ plan: { day: 1 } });
    await store.connect("u1", remote);
    remote.write("plan", { day: 2 });
    await store.refresh();
    expect(store.get("plan", null)).toEqual({ day: 2 });
  });

  it("a deletion elsewhere removes it here", async () => {
    const { store } = setup();
    const remote = fakeRemote({ list: [{ id: "a" }] });
    await store.connect("u1", remote);
    remote.rows.delete("list");
    await store.refresh();
    expect(store.get("list", null)).toBeNull();
  });

  it("when both changed, the newer copy wins (default rule)", async () => {
    const online = { value: false };
    const { store } = setup(memoryStorage(), online);
    const remote = fakeRemote({ plan: { day: 1 } });
    await store.connect("u1", remote);
    remote.offline = true;
    store.set("plan", { day: "here" }); // 2026-10-10: newer than the server's 2026-10-01
    await vi.advanceTimersByTimeAsync(1100);
    remote.offline = false;
    remote.write("plan", { day: "there" });
    online.value = true;
    await store.refresh();
    expect(store.get("plan", null)).toEqual({ day: "here" });
    expect(remote.rows.get("plan")!.value).toEqual({ day: "here" });
  });

  it("when both changed a list, items from both are kept", async () => {
    const { store } = setup();
    const remote = fakeRemote({ list: [{ id: "a" }] });
    await store.connect("u1", remote);
    remote.offline = true;
    store.set("list", [{ id: "a" }, { id: "phone" }]);
    await vi.advanceTimersByTimeAsync(1100);
    remote.offline = false;
    remote.write("list", [{ id: "a" }, { id: "laptop" }]);
    await store.refresh();
    expect(store.get("list", [])).toEqual([{ id: "a" }, { id: "phone" }, { id: "laptop" }]);
  });
});

describe("another account on the same device", () => {
  it("signing out clears the account's data from the device", async () => {
    const { store, storage } = setup(memoryStorage({ list: [{ id: "a" }], theme: "dark" }));
    await store.connect("u1", fakeRemote());
    store.disconnect();
    expect(storage.getItem("list")).toBeNull();
    expect(storage.getItem(SYNC_META_KEY)).toBeNull();
    expect(storage.getItem("theme")).toBe('"dark"');
    expect(store.status()).toBe("local");
  });

  it("a different user never sees or uploads the previous user's data", async () => {
    const { store } = setup(memoryStorage({ list: [{ id: "a's" }] }));
    await store.connect("a", fakeRemote());
    const remoteB = fakeRemote({ plan: { b: true } });
    await store.connect("b", remoteB);
    expect(store.get("list", null)).toBeNull();
    expect(remoteB.rows.has("list")).toBe(false);
    expect(store.get("plan", null)).toEqual({ b: true });
  });

  it("signing out without ever having synced leaves local data alone", () => {
    const { store, storage } = setup(memoryStorage({ list: [{ id: "a" }] }));
    store.disconnect();
    expect(storage.getItem("list")).not.toBeNull();
  });
});

describe("merge rules", () => {
  const context = { localAt: 2, remoteAt: 1 };

  it("semester subjects: both sides' subjects, the newer label", () => {
    expect(
      mergeSemesterSubjects(
        { subjects: [{ id: "1", name: "ალგორითმები" }], semesterLabel: "შემოდგომა" },
        { subjects: [{ id: "2", name: "სტატისტიკა" }], semesterLabel: "გაზაფხული" },
        context,
      ),
    ).toEqual({
      subjects: [
        { id: "1", name: "ალგორითმები" },
        { id: "2", name: "სტატისტიკა" },
      ],
      semesterLabel: "შემოდგომა",
    });
  });

  it("study plan: the same plan keeps days done on either device; a new plan replaces it", () => {
    const plan = { savedAt: "2026-10-01", doneDates: ["2026-10-02"] };
    expect(mergeStudyPlan(plan, { ...plan, doneDates: ["2026-10-03"] }, context)).toEqual({
      savedAt: "2026-10-01",
      doneDates: ["2026-10-02", "2026-10-03"],
    });
    const newer = { savedAt: "2026-10-05", doneDates: [] };
    expect(mergeStudyPlan(plan, newer, { localAt: 1, remoteAt: 2 })).toBe(newer);
  });

  it("covers every key of the first category", () => {
    expect(SYNCED_KEYS.map((spec) => spec.key)).toEqual([
      "spaceedu-semester-subjects",
      "spaceedu-dashboard-calendar-events",
      "spaceedu-syllabus-generated-milestones",
      "spaceedu-dashboard-study-plan",
      "spaceedu-dashboard-study-plan-student",
      "spaceedu-exam-countdown-days",
    ]);
  });
});
