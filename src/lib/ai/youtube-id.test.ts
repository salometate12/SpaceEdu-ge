import { describe, expect, it } from "vitest";
import { extractYouTubeVideoId } from "./youtube-id";

describe("extractYouTubeVideoId", () => {
  it("reads watch, short and embed links", () => {
    expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeVideoId("not a link")).toBeNull();
  });
});
