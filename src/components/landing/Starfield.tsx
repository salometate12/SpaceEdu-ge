"use client";

import type { CSSProperties } from "react";

interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: boolean;
}

// Deterministic PRNG so the star field is identical on server and client
// (avoids hydration mismatches from Math.random()).
function seededRandom(seed: number) {
  let t = seed;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const STAR_COUNT = 70;
const rand = seededRandom(1337);

const STARS: Star[] = Array.from({ length: STAR_COUNT }).map((_, id) => ({
  id,
  top: rand() * 100,
  left: rand() * 100,
  size: 1 + rand() * 2,
  delay: rand() * 6,
  duration: 3 + rand() * 4,
  drift: rand() > 0.65,
}));

export function Starfield() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {STARS.map((star) => (
        <span
          key={star.id}
          className={`absolute rounded-full bg-white ${
            star.drift ? "animate-star-drift" : "animate-star-twinkle"
          }`}
          style={
            {
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              "--star-delay": `${star.delay}s`,
              "--star-duration": `${star.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
