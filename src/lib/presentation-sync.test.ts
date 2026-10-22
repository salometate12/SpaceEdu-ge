import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UploadedPhoto } from "./presentation-photos";
import type { SavedPresentation } from "./presentation-store";
import { createPresentationSync, PRESENTATION_SYNC_KEY, type LocalPresentations, type PresentationRemote } from "./presentation-sync";
import type { KeyValueStorage } from "./user-store";
import { dataUrlToBlob } from "./presentation-sync-client";

const photo = (id: string): UploadedPhoto => ({ id, dataUrl: `data:image/jpeg;base64,${id}`, width: 800, height: 600, name: `${id}.jpg`, caption: "" });

const deck = (id: string, updatedAt: number, photoIds: string[] = []): SavedPresentation => ({
  id,
  title: `პრეზენტაცია ${id}`,
  createdAt: 1,
  updatedAt,
  status: "generated",
  step: 4,
  form: {} as SavedPresentation["form"],
  templateId: "classic",
  qa: {} as SavedPresentation["qa"],
  slides: [],
  photoIds,
});

/** This device's IndexedDB. */
function fakeLocal(initial: { record: SavedPresentation; photos: UploadedPhoto[] }[] = []) {
  const records = new Map(initial.map(({ record }) => [record.id, record]));
  const photos = new Map(initial.map(({ record, photos: list }) => [record.id, list]));
  const local: LocalPresentations & { records: typeof records; photos: typeof photos } = {
    records,
    photos,
    list: async () => [...records.values()],
    load: async (id) => {
      const presentation = records.get(id);
      if (!presentation) return null;
      const have = new Map((photos.get(id) ?? []).map((p) => [p.id, p]));
      return { presentation, photos: presentation.photoIds.map((photoId) => have.get(photoId)).filter((p): p is UploadedPhoto => Boolean(p)) };
    },
    putRecord: async (record) => void records.set(record.id, record),
    remove: async (id) => {
      records.delete(id);
      photos.delete(id);
    },
    clear: async () => {
      records.clear();
      photos.clear();
    },
  };
  return local;
}

/** The account: rows and photo files. */
function fakeRemote(initial: SavedPresentation[] = []) {
  const rows = new Map(initial.map((record) => [record.id, record]));
  const files = new Map<string, string>();
  const remote: PresentationRemote & { rows: typeof rows; files: typeof files; offline: boolean } = {
    rows,
    files,
    offline: false,
    list: vi.fn(async () => {
      if (remote.offline) throw new Error("offline");
      return [...rows.values()];
    }),
    upsert: vi.fn(async (record) => {
      if (remote.offline) throw new Error("offline");
      rows.set(record.id, structuredClone(record));
    }),
    remove: vi.fn(async (id) => void rows.delete(id)),
    uploadPhoto: vi.fn(async (presentationId, p) => {
      if (remote.offline) throw new Error("offline");
      files.set(`${presentationId}/${p.id}`, p.dataUrl);
    }),
    removePhotos: vi.fn(async (presentationId, ids) => ids.forEach((photoId: string) => files.delete(`${presentationId}/${photoId}`))),
    downloadPhoto: vi.fn(async (presentationId, photoId) => files.get(`${presentationId}/${photoId}`) ?? null),
  };
  return remote;
}

function memory(): KeyValueStorage {
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
}

const setup = (local = fakeLocal(), online = { value: true }) => {
  const storage = memory();
  const emitted = vi.fn();
  const sync = createPresentationSync({ local, storage, isOnline: () => online.value, emit: emitted });
  return { sync, local, storage, emitted, online };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("presentations on the account", () => {
  it("first sign-in uploads what was only on this device: photos as files, the record with their sizes", async () => {
    const { sync } = setup(fakeLocal([{ record: deck("p1", 10, ["a", "b"]), photos: [photo("a"), photo("b")] }]));
    const remote = fakeRemote();
    await sync.connect("u1", remote);
    expect([...remote.files.keys()]).toEqual(["p1/a", "p1/b"]);
    expect(remote.rows.get("p1")!.photoMeta).toEqual([
      { id: "a", width: 800, height: 600, name: "a.jpg", caption: "" },
      { id: "b", width: 800, height: 600, name: "b.jpg", caption: "" },
    ]);
    // No photo data in the row itself.
    expect(JSON.stringify(remote.rows.get("p1"))).not.toContain("base64");
  });

  it("a new device gets the list at once and each photo when the presentation is opened", async () => {
    const remote = fakeRemote([{ ...deck("p1", 10, ["a"]), photoMeta: [{ id: "a", width: 800, height: 600, name: "a.jpg", caption: "ზღვა" }] }]);
    remote.files.set("p1/a", photo("a").dataUrl);
    const { sync, local, emitted } = setup();
    await sync.connect("u1", remote);
    expect(local.records.get("p1")?.title).toBe("პრეზენტაცია p1");
    expect(emitted).toHaveBeenCalled();
    expect(remote.downloadPhoto).not.toHaveBeenCalled();
    expect(await sync.fetchPhoto("p1", { id: "a", width: 800, height: 600, name: "a.jpg", caption: "ზღვა" })).toEqual({
      ...photo("a"),
      caption: "ზღვა",
    });
  });

  it("a save is uploaded ~2s later, and only new photos are sent", async () => {
    const local = fakeLocal([{ record: deck("p1", 10, ["a"]), photos: [photo("a")] }]);
    const { sync } = setup(local);
    const remote = fakeRemote();
    await sync.connect("u1", remote);
    expect(remote.uploadPhoto).toHaveBeenCalledTimes(1);

    local.records.set("p1", deck("p1", 20, ["a", "b"]));
    local.photos.set("p1", [photo("a"), photo("b")]);
    sync.changed("p1");
    sync.changed("p1");
    await vi.advanceTimersByTimeAsync(1900);
    expect(remote.rows.get("p1")!.updatedAt).toBe(10);
    await vi.advanceTimersByTimeAsync(200);
    expect(remote.rows.get("p1")!.updatedAt).toBe(20);
    expect(remote.uploadPhoto).toHaveBeenCalledTimes(2);
  });

  it("a photo taken out of the presentation is removed from the account", async () => {
    const local = fakeLocal([{ record: deck("p1", 10, ["a", "b"]), photos: [photo("a"), photo("b")] }]);
    const { sync } = setup(local);
    const remote = fakeRemote();
    await sync.connect("u1", remote);
    local.records.set("p1", deck("p1", 20, ["b"]));
    sync.changed("p1");
    await vi.advanceTimersByTimeAsync(2100);
    expect([...remote.files.keys()]).toEqual(["p1/b"]);
  });

  it("a delete here deletes the row and its photos there", async () => {
    const local = fakeLocal([{ record: deck("p1", 10, ["a"]), photos: [photo("a")] }]);
    const { sync } = setup(local);
    const remote = fakeRemote();
    await sync.connect("u1", remote);
    await local.remove("p1");
    sync.deleted("p1");
    await vi.advanceTimersByTimeAsync(2100);
    expect(remote.rows.size).toBe(0);
    expect(remote.files.size).toBe(0);
  });

  it("a delete on another device removes it here; a newer edit there replaces this copy", async () => {
    const local = fakeLocal([
      { record: deck("p1", 10), photos: [] },
      { record: deck("p2", 10), photos: [] },
    ]);
    const { sync } = setup(local);
    const remote = fakeRemote();
    await sync.connect("u1", remote);
    remote.rows.delete("p1");
    remote.rows.set("p2", { ...deck("p2", 30), title: "გადარქმეული" });
    await sync.refresh();
    expect(local.records.has("p1")).toBe(false);
    expect(local.records.get("p2")?.title).toBe("გადარქმეული");
  });

  it("offline: changes wait in the queue and go once the connection is back", async () => {
    const online = { value: true };
    const local = fakeLocal([{ record: deck("p1", 10), photos: [] }]);
    const { sync, storage } = setup(local, online);
    const remote = fakeRemote();
    await sync.connect("u1", remote);
    online.value = false;
    local.records.set("p1", { ...deck("p1", 20), title: "offline-ში" });
    sync.changed("p1");
    await vi.advanceTimersByTimeAsync(2100);
    expect(remote.rows.get("p1")!.title).toBe("პრეზენტაცია p1");
    expect(JSON.parse(storage.getItem(PRESENTATION_SYNC_KEY)!).dirty).toEqual({ p1: true });
    online.value = true;
    await sync.refresh();
    expect(remote.rows.get("p1")!.title).toBe("offline-ში");
  });

  it("signing out clears them from the device; another account never sees them", async () => {
    const local = fakeLocal([{ record: deck("p1", 10), photos: [] }]);
    const { sync } = setup(local);
    await sync.connect("a", fakeRemote());
    const remoteB = fakeRemote();
    await sync.connect("b", remoteB);
    expect(local.records.size).toBe(0);
    expect(remoteB.rows.size).toBe(0);

    local.records.set("p2", deck("p2", 10));
    await sync.disconnect();
    expect(local.records.size).toBe(0);
  });
});

describe("photo upload", () => {
  it("turns a data URL into a Blob without fetch (the CSP blocks data: in connect-src)", async () => {
    const blob = dataUrlToBlob("data:image/jpeg;base64,/9j/4AA=");
    expect(blob.type).toBe("image/jpeg");
    expect([...new Uint8Array(await blob.arrayBuffer())]).toEqual([0xff, 0xd8, 0xff, 0xe0, 0x00]);
  });
});
