"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  anchorScrollTop,
  endIsHidden,
  endScrollTop,
  scrollBehaviorFor,
  turnMinHeight,
  type FeedViewport,
} from "@/lib/chat-scroll";

/** Messages are marked `data-chat-message="user" | "assistant"`; the last
 * user one is the question that gets pinned to the top. */
const MESSAGE = "[data-chat-message]";
const QUESTION = '[data-chat-message="user"]';

/** Height the last question + answer keep at least (see `turnStyle`). */
const TURN_VAR = "--chat-turn-min";

function viewportOf(feed: HTMLElement): FeedViewport {
  return {
    scrollTop: feed.scrollTop,
    clientHeight: feed.clientHeight,
    paddingBottom: parseFloat(getComputedStyle(feed).paddingBottom) || 0,
  };
}

/** Where an element sits in the feed's scrollable content. */
function offsetIn(feed: HTMLElement, element: Element, edge: "top" | "bottom"): number {
  return element.getBoundingClientRect()[edge] - feed.getBoundingClientRect().top + feed.scrollTop;
}

function lastOf(feed: HTMLElement, selector: string): Element | null {
  const all = feed.querySelectorAll(selector);
  return all[all.length - 1] ?? null;
}

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Chat scrolling (see lib/chat-scroll): a new question (`questionKey`, e.g.
 * its id) scrolls up to the top of the feed; a new `openKey` (a chat
 * opened) does the same without animation. The stream never moves the feed.
 *
 * Pass `attachFeed` as the scrolling element's ref, put `turnStyle` on the
 * wrapper of the last question and its answer, and show a "↓" button while
 * `showJump`.
 */
export function useChatScroll({ questionKey, openKey }: { questionKey: string | null; openKey?: unknown }) {
  const [feed, setFeed] = useState<HTMLElement | null>(null);
  const [showJump, setShowJump] = useState(false);
  const seen = useRef<{ question: string | null; open: unknown }>({ question: null, open: openKey });

  /** Keeps the turn's minimum height in step with the feed's size. */
  const sizeTurn = useCallback((element: HTMLElement) => {
    const viewport = viewportOf(element);
    element.style.setProperty(TURN_VAR, `${turnMinHeight(viewport.clientHeight, viewport.paddingBottom)}px`);
  }, []);

  // A new question or an opened chat: pin the last question to the top.
  useLayoutEffect(() => {
    if (!feed) return;
    const opened = openKey !== seen.current.open;
    const asked = questionKey !== seen.current.question;
    seen.current = { question: questionKey, open: openKey };
    if (!questionKey || !(opened || asked)) return;
    const behavior = scrollBehaviorFor(opened ? "open" : "send", reduceMotion());
    const question = lastOf(feed, QUESTION);
    if (!behavior || !question) return;
    sizeTurn(feed);
    feed.scrollTo({ top: anchorScrollTop(offsetIn(feed, question, "top")), behavior });
  }, [feed, questionKey, openKey, sizeTurn]);

  // "↓" whenever the answer runs past what's visible — re-checked as the
  // user scrolls, the feed resizes, or the stream adds text.
  useEffect(() => {
    if (!feed) return;
    let frame = 0;
    const check = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        sizeTurn(feed);
        const last = lastOf(feed, MESSAGE);
        setShowJump(Boolean(last) && endIsHidden(offsetIn(feed, last!, "bottom"), viewportOf(feed)));
      });
    };
    check();
    feed.addEventListener("scroll", check, { passive: true });
    const resize = new ResizeObserver(check);
    resize.observe(feed);
    const mutations = new MutationObserver(check);
    mutations.observe(feed, { childList: true, subtree: true, characterData: true });
    return () => {
      cancelAnimationFrame(frame);
      feed.removeEventListener("scroll", check);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [feed, sizeTurn]);

  const jumpToEnd = useCallback(() => {
    const last = feed && lastOf(feed, MESSAGE);
    if (!feed || !last) return;
    feed.scrollTo({
      top: endScrollTop(offsetIn(feed, last, "bottom"), viewportOf(feed)),
      behavior: reduceMotion() ? "auto" : "smooth",
    });
  }, [feed]);

  return {
    attachFeed: setFeed,
    turnStyle: { minHeight: `var(${TURN_VAR}, 0px)` },
    showJump,
    jumpToEnd,
  };
}
