/**
 * The phone's tools bento: a wide card on a row of its own, then two half
 * cards side by side, repeating. A half card that would end up alone on
 * the last row (an odd one out) takes the full width instead.
 */
export function isWideToolCard(index: number, count: number): boolean {
  if (index % 3 === 0) return true;
  return index % 3 === 1 && index === count - 1;
}
