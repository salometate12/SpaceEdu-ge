import { describe, expect, it } from "vitest";
import { checkPhotoBatch, photoFileProblem, photoOrientation, MAX_PHOTOS } from "./presentation-photos";

const file = (name: string, type: string, size = 1000) => ({ name, type, size }) as File;

describe("photo checks", () => {
  it("accepts JPG, PNG and WEBP up to 10 MB", () => {
    expect(photoFileProblem(file("a.jpg", "image/jpeg"))).toBeNull();
    expect(photoFileProblem(file("a.png", "image/png"))).toBeNull();
    expect(photoFileProblem(file("a.webp", "image/webp"))).toBeNull();
  });

  it("explains HEIC, other formats and oversized files, naming the file", () => {
    expect(photoFileProblem(file("IMG_1.HEIC", "image/heic"))).toContain("HEIC");
    expect(photoFileProblem(file("IMG_2.heic", ""))).toContain("„IMG_2.heic“");
    expect(photoFileProblem(file("doc.pdf", "application/pdf"))).toContain("JPG, PNG ან WEBP");
    expect(photoFileProblem(file("big.jpg", "image/jpeg", 12 * 1024 * 1024))).toContain("12.0 MB");
  });

  it("rejects the 11th photo with a clear message", () => {
    const { accepted, errors } = checkPhotoBatch([file("10.jpg", "image/jpeg"), file("11.jpg", "image/jpeg")], 9);
    expect(accepted.map((f) => f.name)).toEqual(["10.jpg"]);
    expect(errors).toEqual([`„11.jpg“: მაქსიმუმ ${MAX_PHOTOS} ფოტოს ატვირთვა შეიძლება.`]);
  });

  it("tells landscape, portrait and square apart", () => {
    expect(photoOrientation(1600, 900)).toBe("landscape");
    expect(photoOrientation(900, 1600)).toBe("portrait");
    expect(photoOrientation(1000, 1040)).toBe("square");
  });
});
