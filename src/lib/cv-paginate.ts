/**
 * Page breaks for the A4 CV: any block ([data-cv-block]) that would run
 * across the bottom of a page is pushed to the top of the next one (after
 * the top margin), so no heading, bullet or education entry is cut. The
 * sheet then fills whole pages. Works on the unscaled layout.
 */

import { A4_HEIGHT_PX } from "@/lib/cv-sheet";

/** Where `top`–`bottom` would have to start to not straddle a page break, or null when it fits. */
export function pushToNextPage(top: number, bottom: number, page = A4_HEIGHT_PX, topMargin = 56): number | null {
  const height = bottom - top;
  if (height >= page - 2 * topMargin) return null; // taller than a page: let it split
  const startPage = Math.floor(top / page);
  const endPage = Math.floor((bottom - 1) / page);
  if (startPage === endPage) return null;
  return (startPage + 1) * page + topMargin;
}

/** Pages a sheet this tall needs (a pixel or two of rounding doesn't add a page). */
export function pageCount(height: number, page = A4_HEIGHT_PX): number {
  return Math.max(1, Math.ceil((height - 2) / page));
}

/** Applies the pushes to a rendered sheet; returns how many pages it needs. */
export function paginateSheet(sheet: HTMLElement, page = A4_HEIGHT_PX): number {
  const blocks = Array.from(sheet.querySelectorAll<HTMLElement>("[data-cv-block]"));
  // Undo the previous pass: back to each block's own margin (remembered once).
  for (const block of blocks) {
    if (block.dataset.cvMargin === undefined) block.dataset.cvMargin = block.style.marginTop;
    else block.style.marginTop = block.dataset.cvMargin;
  }
  sheet.style.minHeight = `${page}px`;
  const sheetTop = sheet.getBoundingClientRect().top;
  const scale = sheet.getBoundingClientRect().height / sheet.offsetHeight || 1;
  blocks.forEach((block, index) => {
    const rect = block.getBoundingClientRect();
    const top = (rect.top - sheetTop) / scale;
    // A heading counts together with the block after it, so it moves with it.
    const next = block.dataset.cvKeepNext !== undefined ? blocks[index + 1] : undefined;
    const bottom = ((next ?? block).getBoundingClientRect().bottom - sheetTop) / scale;
    const target = pushToNextPage(top, bottom, page);
    if (target !== null) {
      const current = parseFloat(getComputedStyle(block).marginTop) || 0;
      block.style.marginTop = `${current + (target - top)}px`;
    }
  });
  const pages = pageCount(sheet.scrollHeight, page);
  sheet.style.minHeight = `${pages * page}px`;
  return pages;
}
