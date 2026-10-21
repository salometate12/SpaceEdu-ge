/**
 * Where a chat feed scrolls, the way ChatGPT and Claude do it: a new question
 * moves to the top of the feed and its answer grows underneath, read from its
 * start. Nothing follows the stream down; a "↓" button jumps to the end.
 * Pure numbers, so it is testable without a DOM (useChatScroll applies it).
 */

/** Gap between the top of the feed and the question pinned under it. */
export const ANCHOR_GAP = 16;
/** How far the answer may run past the visible area before "↓" shows. */
export const JUMP_SLACK = 24;

/** A feed's scroll state. `paddingBottom` is room under the content that a
 * floating input covers, so it doesn't count as visible. */
export interface FeedViewport {
  scrollTop: number;
  clientHeight: number;
  paddingBottom: number;
}

/** What moved the feed's content. */
export type ChatScrollCause =
  /** The user sent a question. */
  | "send"
  /** A saved conversation (or the chat view) was opened. */
  | "open"
  /** The answer grew while streaming. */
  | "stream"
  /** The user scrolled. */
  | "user-scroll";

/**
 * How the feed scrolls for a cause, or null when it stays where it is:
 * only a new question or an opened chat move it, never the stream or the
 * user's own scrolling.
 */
export function scrollBehaviorFor(cause: ChatScrollCause, reduceMotion: boolean): ScrollBehavior | null {
  if (cause === "open") return "auto";
  if (cause === "send") return reduceMotion ? "auto" : "smooth";
  return null;
}

/** scrollTop that puts a question (`anchorOffset` from the content's top) just under the feed's top. */
export function anchorScrollTop(anchorOffset: number, gap = ANCHOR_GAP): number {
  return Math.max(0, Math.round(anchorOffset - gap));
}

/**
 * Minimum height of the last question + its answer, so the question can
 * reach the top even while the answer is still short.
 */
export function turnMinHeight(clientHeight: number, paddingBottom: number, gap = ANCHOR_GAP): number {
  return Math.max(0, Math.round(clientHeight - paddingBottom - gap));
}

/** The last visible content line, in content coordinates. */
export function visibleEnd(viewport: FeedViewport): number {
  return viewport.scrollTop + viewport.clientHeight - viewport.paddingBottom;
}

/** True when the answer's end (`contentEnd`) is below what the feed shows. */
export function endIsHidden(contentEnd: number, viewport: FeedViewport, slack = JUMP_SLACK): boolean {
  return contentEnd > visibleEnd(viewport) + slack;
}

/** scrollTop that shows the answer's end just above the input. */
export function endScrollTop(contentEnd: number, viewport: FeedViewport, gap = ANCHOR_GAP): number {
  return Math.max(0, Math.round(contentEnd - (viewport.clientHeight - viewport.paddingBottom) + gap));
}
