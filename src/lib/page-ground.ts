/**
 * Which surface a route paints itself on.
 *
 * Two things need this answer and must not disagree: the header strip,
 * which floats over the page, and the document itself, whose background
 * shows in the scrollbar gutter — a strip outside the layout viewport
 * that no element can cover.
 */
export type PageGround = "app" | "landing" | "paper";

export function pageGround(pathname: string | null | undefined): PageGround {
  if (pathname === "/") return "landing";
  if (pathname === "/about" || pathname === "/select-space") return "paper";
  return "app";
}
