import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { UploadedPhoto } from "./presentation-photos";
import {
  deletePresentation,
  duplicatePresentation,
  listPresentations,
  loadPresentation,
  renamePresentation,
  savePresentation,
  type SavedPresentation,
} from "./presentation-store";

const photo = (id: string): UploadedPhoto => ({ id, dataUrl: `data:image/jpeg;base64,${id}`, width: 400, height: 300, name: `${id}.jpg`, caption: "" });

const record = (id: string, updatedAt: number, extra: Partial<SavedPresentation> = {}): SavedPresentation => ({
  id,
  title: `პრეზენტაცია ${id}`,
  createdAt: updatedAt,
  updatedAt,
  status: "draft",
  step: 1,
  form: { topic: "ინფლაცია", subject: "", slideCount: 10, level: "ბაკალავრიატი", language: "ქართული", extraInstructions: "" },
  templateId: "galaxy",
  qa: { goal: "", audience: "", tone: "", mainPoint: "" },
  slides: null,
  photoIds: [],
  ...extra,
});

describe("presentation store", () => {
  beforeEach(async () => {
    for (const p of await listPresentations()) await deletePresentation(p.id);
  });

  it("saves and loads a presentation with its photos in order", async () => {
    await savePresentation(record("a", 1), [photo("p2"), photo("p1")]);
    const loaded = await loadPresentation("a");
    expect(loaded?.presentation.title).toBe("პრეზენტაცია a");
    expect(loaded?.presentation.photoIds).toEqual(["p2", "p1"]);
    expect(loaded?.photos.map((p) => p.id)).toEqual(["p2", "p1"]);
  });

  it("updates in place and drops photos the presentation no longer has", async () => {
    const photos = [photo("p1"), photo("p2")];
    await savePresentation(record("a", 1), photos);
    await savePresentation(record("a", 2, { step: 4, status: "generated" }), [photos[1]]);
    const loaded = await loadPresentation("a");
    expect(loaded?.presentation).toMatchObject({ step: 4, status: "generated", updatedAt: 2 });
    expect(loaded?.photos.map((p) => p.id)).toEqual(["p2"]);
    expect(await listPresentations()).toHaveLength(1);
  });

  it("lists newest first and returns null for an unknown id", async () => {
    await savePresentation(record("old", 1), []);
    await savePresentation(record("new", 5), []);
    expect((await listPresentations()).map((p) => p.id)).toEqual(["new", "old"]);
    expect(await loadPresentation("missing")).toBeNull();
  });

  it("renames, duplicates with photos, and deletes", async () => {
    await savePresentation(record("a", 1), [photo("p1")]);
    await renamePresentation("a", "ახალი სახელი");
    expect((await loadPresentation("a"))?.presentation.title).toBe("ახალი სახელი");

    const copy = await duplicatePresentation("a");
    expect(copy?.id).not.toBe("a");
    expect(copy?.title).toBe("ახალი სახელი (ასლი)");
    expect((await loadPresentation(copy!.id))?.photos.map((p) => p.id)).toEqual(["p1"]);

    await deletePresentation("a");
    expect(await loadPresentation("a")).toBeNull();
    // the copy keeps its own photos
    expect((await loadPresentation(copy!.id))?.photos).toHaveLength(1);
  });
});
