import { describe, expect, it } from "vitest";
import { assemble, collectionStamp, itemHash, splitItems } from "./user-items-remote";
import { fitsOneRow, MAX_VALUE_BYTES } from "./user-store";

describe("lists as one row per item", () => {
  it("splits a list by id, positions counted from the end so a new first item leaves the rest alone", () => {
    const before = splitItems([{ id: "b" }, { id: "a" }]);
    const after = splitItems([{ id: "c" }, { id: "b" }, { id: "a" }]);
    expect(before?.map((item) => [item.id, item.position])).toEqual([["b", 1], ["a", 0]]);
    expect(after?.map((item) => [item.id, item.position])).toEqual([["c", 2], ["b", 1], ["a", 0]]);
    // The same item at the same place: the same fingerprint, so it isn't sent again.
    expect(itemHash(after![1].data, after![1].position)).toBe(itemHash(before![0].data, before![0].position));
    expect(itemHash({ id: "b", x: 1 }, 1)).not.toBe(itemHash({ id: "b", x: 2 }, 1));
  });

  it("keeps a list whole when an item has no id", () => {
    expect(splitItems([{ id: "a" }, { title: "no id" }])).toBeNull();
    expect(splitItems({ not: "a list" })).toBeNull();
    expect(splitItems([{ id: 7 }])?.[0].id).toBe("7");
  });

  it("puts the rows back in their order, with a stamp that also moves when one is removed", () => {
    const rows = [
      { collection: "decks", item_id: "a", position: 0, data: { id: "a" }, updated_at: "2026-11-01T10:00:00.000Z" },
      { collection: "decks", item_id: "c", position: 2, data: { id: "c" }, updated_at: "2026-11-01T12:00:00.000Z" },
      { collection: "decks", item_id: "b", position: 1, data: { id: "b" }, updated_at: "2026-11-01T11:00:00.000Z" },
    ];
    const decks = assemble(rows).get("decks")!;
    expect(decks.value).toEqual([{ id: "c" }, { id: "b" }, { id: "a" }]);
    expect(decks.stamp).toBe(collectionStamp(["2026-11-01T12:00:00.000Z"], 3));
    expect(collectionStamp(["2026-11-01T12:00:00.000Z"], 2)).not.toBe(decks.stamp);
  });
});

describe("one user_data row", () => {
  it("is measured in bytes: Georgian text is three bytes a letter", () => {
    const latin = "a".repeat(MAX_VALUE_BYTES * 0.8);
    const georgian = "ა".repeat(MAX_VALUE_BYTES * 0.4);
    expect(latin.length).toBeGreaterThan(georgian.length);
    expect(fitsOneRow(latin)).toBe(true);
    expect(fitsOneRow(georgian)).toBe(false);
  });
});
