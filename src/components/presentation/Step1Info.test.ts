import { describe, expect, it } from "vitest";
import { withPhrase } from "./Step1Info";

describe("withPhrase", () => {
  it("adds the chip's sentence once, on its own line", () => {
    expect(withPhrase("", "დაამატე სტატისტიკა.")).toBe("დაამატე სტატისტიკა.");
    expect(withPhrase("ბოლოს წყაროები", "დაამატე სტატისტიკა.")).toBe("ბოლოს წყაროები\nდაამატე სტატისტიკა.");
    expect(withPhrase("დაამატე სტატისტიკა.", "დაამატე სტატისტიკა.")).toBe("დაამატე სტატისტიკა.");
  });
});
