"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pageGround } from "@/lib/page-ground";

/**
 * Mirrors the current route's ground onto `<html>` as `data-ground`, which
 * globals.css turns into the document background and `color-scheme`.
 *
 * This is what the scrollbar gutter reads. The gutter lives outside the
 * layout viewport, so no element — not the header strip, not the page —
 * can paint it; without this the browser drew its own light track down
 * the right-hand edge of the dark landing.
 *
 * The first paint is handled by the inline script in the root layout;
 * this keeps the attribute right across client-side navigation.
 */
export function DocumentGround() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.dataset.ground = pageGround(pathname);
  }, [pathname]);

  return null;
}
