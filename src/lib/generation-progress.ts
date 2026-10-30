/**
 * The loader's step and bar. With a card count (`total`) the cards parsed
 * from the stream drive both; without one (the summary) time does, slowing
 * as it goes. Neither passes 95%: only the finished answer completes it.
 */
export interface GenerationTick {
  ready: number;
  /** Cards asked for; 0 when nothing is counted. */
  total: number;
  /** Seconds since the request went out. */
  elapsed: number;
}

export const MAX_SHOWN_PERCENT = 95;

/** 0 reading · 1 picking concepts · 2 writing · 3 checking. */
export function generationStep({ ready, total, elapsed }: GenerationTick): number {
  if (total > 0 && ready > 0) return ready >= total ? 3 : 2;
  if (elapsed < 4) return 0;
  if (elapsed < 10 || total > 0) return 1;
  return 2;
}

export function generationPercent({ ready, total, elapsed }: GenerationTick): number {
  if (total > 0) {
    if (ready === 0) return Math.min(18, Math.round(4 + elapsed * 1.5));
    return Math.min(MAX_SHOWN_PERCENT, Math.round(20 + (ready / total) * 75));
  }
  return Math.min(MAX_SHOWN_PERCENT, Math.round(MAX_SHOWN_PERCENT * (1 - Math.exp(-elapsed / 30))));
}
