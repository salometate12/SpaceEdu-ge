/**
 * Cleans a streamed chat answer without touching its code blocks. (The
 * flashcard parser's `stripCodeFences` keeps only the first fenced block —
 * right for JSON, but on a chat answer it threw away all the prose around
 * a code sample.)
 *
 * The one thing removed: a wrapper, when the model put its *whole* answer
 * inside a single ```markdown / ```md block. Works on partial text too, so
 * it can run on every streamed chunk.
 */
export function sanitizeChatMarkdown(text: string): string {
  let out = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const opening = out.match(/^\s*(```|~~~)\s*(?:markdown|md)\s*\n/i);
  if (opening) {
    const fence = opening[1];
    out = out.slice(opening[0].length);
    const closing = new RegExp(`\\n?${fence}\\s*$`);
    out = out.replace(closing, "");
  }
  return out;
}
