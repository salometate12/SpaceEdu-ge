import { describe, expect, it } from "vitest";
import {
  ANCHOR_GAP,
  anchorScrollTop,
  endIsHidden,
  endScrollTop,
  keepBottomScrollTop,
  scrollBehaviorFor,
  turnMinHeight,
  visibleEnd,
} from "./chat-scroll";

/** A feed 800px tall whose bottom 200px sit under a floating input. */
const feed = { clientHeight: 800, paddingBottom: 200 };

describe("sending a question", () => {
  it("puts the question just under the top of the feed", () => {
    expect(scrollBehaviorFor("send", false)).toBe("smooth");
    expect(anchorScrollTop(1220)).toBe(1220 - ANCHOR_GAP);
  });

  it("can reach that position even while the answer is still short", () => {
    const earlier = 1220; // everything above the new question
    const turn = Math.max(turnMinHeight(feed.clientHeight, feed.paddingBottom), 60 /* question + 1 line */);
    const scrollHeight = earlier + turn + feed.paddingBottom;
    const maxScrollTop = scrollHeight - feed.clientHeight;
    expect(maxScrollTop).toBeGreaterThanOrEqual(anchorScrollTop(earlier));
  });

  it("jumps instead of animating when motion is reduced, and when a chat is opened", () => {
    expect(scrollBehaviorFor("send", true)).toBe("auto");
    expect(scrollBehaviorFor("open", false)).toBe("auto");
  });
});

describe("while the answer streams", () => {
  it("doesn't scroll on its own", () => {
    expect(scrollBehaviorFor("stream", false)).toBeNull();
  });

  it("leaves the user's own scrolling alone", () => {
    expect(scrollBehaviorFor("user-scroll", false)).toBeNull();
  });
});

describe("the ↓ button", () => {
  const top = { ...feed, scrollTop: 1204 };

  it("shows when the answer runs past the input, not for a short one", () => {
    expect(visibleEnd(top)).toBe(1804);
    expect(endIsHidden(1700, top)).toBe(false);
    expect(endIsHidden(2400, top)).toBe(true);
  });

  it("scrolls the answer's end to just above the input", () => {
    const target = endScrollTop(2400, top);
    expect(visibleEnd({ ...top, scrollTop: target })).toBe(2400 + ANCHOR_GAP);
    expect(endIsHidden(2400, { ...top, scrollTop: target })).toBe(false);
  });
});

describe("when the keyboard resizes the feed", () => {
  it("keeps the same distance from the bottom, so the conversation doesn't jump", () => {
    // 800px feed scrolled 120px above the end; the keyboard takes 300px.
    const fromBottom = 2000 - 1080 - 800;
    const top = keepBottomScrollTop(2000, 500, fromBottom);
    expect(2000 - top - 500).toBe(fromBottom);
    expect(keepBottomScrollTop(400, 500, 0)).toBe(0);
  });
});
