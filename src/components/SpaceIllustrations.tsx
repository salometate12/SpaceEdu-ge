"use client";

import { useId } from "react";

/**
 * Hand-built SVG "3D toy" mascot illustrations for the space-selector cards.
 * Same footprint/placement as the previous PNG renders, drawn as soft
 * rounded-shape scenes so they scale crisply and match the brand palette.
 */

export function SchoolIllustration({ className }: { className?: string }) {
  const uid = useId();
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-overalls`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#facc6b" />
          <stop offset="100%" stopColor="#eab54a" />
        </linearGradient>
        <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b07a52" />
          <stop offset="100%" stopColor="#96603c" />
        </linearGradient>
        <linearGradient id={`${uid}-cup`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="105" rx="90" ry="60" fill={`url(#${uid}-glow)`} />
      <ellipse cx="58" cy="98" rx="38" ry="7" fill="#000" opacity="0.28" />

      {/* paper */}
      <g transform="translate(10,72) rotate(-6)">
        <rect width="34" height="24" rx="3" fill="#f5f1e8" />
        <rect x="5" y="6" width="20" height="2.4" rx="1.2" fill="#c9c0ab" />
        <rect x="5" y="11" width="24" height="2.4" rx="1.2" fill="#c9c0ab" />
        <rect x="5" y="16" width="14" height="2.4" rx="1.2" fill="#c9c0ab" />
      </g>

      {/* pencil cup */}
      <g transform="translate(78,62)">
        <path d="M0 10 h20 l-2 22 a2 2 0 0 1 -2 2 h-12 a2 2 0 0 1 -2 -2 Z" fill={`url(#${uid}-cup)`} />
        <ellipse cx="10" cy="10" rx="10" ry="3.4" fill="#c4b5fd" />
        <rect x="4" y="-8" width="3" height="20" rx="1.5" fill="#fbbf24" transform="rotate(-10 4 -8)" />
        <rect x="10" y="-10" width="3" height="22" rx="1.5" fill="#f472b6" transform="rotate(6 10 -10)" />
        <rect x="15" y="-6" width="3" height="18" rx="1.5" fill="#34d399" transform="rotate(16 15 -6)" />
      </g>

      {/* crossed legs */}
      <path d="M22 96 q18 14 42 0 q4 8 -6 10 q-16 6 -34 -1 q-8 -3 -2 -9 Z" fill={`url(#${uid}-skin)`} />

      {/* torso / overalls */}
      <rect x="30" y="58" width="34" height="34" rx="12" fill={`url(#${uid}-overalls)`} />
      <rect x="36" y="50" width="6" height="14" rx="3" fill={`url(#${uid}-overalls)`} />
      <rect x="52" y="50" width="6" height="14" rx="3" fill={`url(#${uid}-overalls)`} />
      <circle cx="39" cy="64" r="2.4" fill="#c17f2e" />
      <circle cx="55" cy="64" r="2.4" fill="#c17f2e" />

      {/* arms */}
      <path d="M30 66 q-14 4 -16 14" stroke={`url(#${uid}-skin)`} strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M64 66 q10 2 12 10" stroke={`url(#${uid}-skin)`} strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* head */}
      <circle cx="47" cy="42" r="16" fill={`url(#${uid}-skin)`} />
      <path d="M31 40 q-6 10 2 18 q-2 -10 4 -14 Z" fill="#241708" />
      <path d="M63 40 q6 10 -2 18 q2 -10 -4 -14 Z" fill="#241708" />
      <path d="M31 36 q4 -14 32 -2 q-4 -2 -16 -2 q-12 0 -16 4 Z" fill="#241708" />
      <circle cx="41" cy="43" r="1.8" fill="#1c1208" />
      <circle cx="53" cy="43" r="1.8" fill="#1c1208" />
      <path d="M42 50 q5 4 10 0" stroke="#1c1208" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function AbiturientIllustration({ className }: { className?: string }) {
  const uid = useId();
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-desktop`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e7d3ab" />
          <stop offset="100%" stopColor="#c9a66b" />
        </linearGradient>
        <linearGradient id={`${uid}-deskfront`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9814f" />
          <stop offset="100%" stopColor="#8a693d" />
        </linearGradient>
        <linearGradient id={`${uid}-shirt`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c99668" />
          <stop offset="100%" stopColor="#a97949" />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="106" rx="90" ry="55" fill={`url(#${uid}-glow)`} />
      <ellipse cx="58" cy="100" rx="42" ry="7" fill="#000" opacity="0.28" />

      {/* desk */}
      <path d="M8 78 L60 62 L112 78 L92 96 L28 96 Z" fill={`url(#${uid}-desktop)`} />
      <path d="M28 96 L92 96 L92 104 L28 104 Z" fill={`url(#${uid}-deskfront)`} />
      <path d="M8 78 L28 96 L28 104 L8 86 Z" fill="#8a693d" opacity="0.7" />

      {/* open book on desk */}
      <g transform="translate(38,72)">
        <path d="M0 6 L14 2 L14 14 L0 18 Z" fill="#f5f1e8" />
        <path d="M14 2 L28 6 L28 18 L14 14 Z" fill="#e7e0cf" />
        <path d="M14 2 L14 14" stroke="#c9c0ab" strokeWidth="1" />
      </g>

      {/* mug */}
      <g transform="translate(74,68)">
        <path d="M0 6 h12 l-1 12 a1.5 1.5 0 0 1 -1.5 1.5 h-8 a1.5 1.5 0 0 1 -1.5 -1.5 Z" fill="#67e8f9" />
        <ellipse cx="6" cy="6" rx="6" ry="2" fill="#a5f3fc" />
        <path d="M12 9 q6 0 4 6 q-1 3 -5 2" fill="none" stroke="#67e8f9" strokeWidth="2" />
      </g>

      {/* character */}
      <path d="M40 62 q-10 4 -12 12" stroke={`url(#${uid}-skin)`} strokeWidth="7" strokeLinecap="round" fill="none" />
      <rect x="40" y="38" width="30" height="30" rx="12" fill={`url(#${uid}-shirt)`} />
      <circle cx="55" cy="26" r="14" fill={`url(#${uid}-skin)`} />
      <path d="M41 24 q2 -14 28 -2 q-6 -4 -14 -4 q-10 0 -14 6 Z" fill="#2b1a10" />
      <circle cx="50" cy="27" r="1.6" fill="#241708" />
      <circle cx="60" cy="27" r="1.6" fill="#241708" />
      <path d="M50 33 q5 3 10 0" stroke="#241708" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function StudentIllustration({ className }: { className?: string }) {
  const uid = useId();
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-book1top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`${uid}-book1front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id={`${uid}-book2top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fefefe" />
          <stop offset="100%" stopColor="#e5e7eb" />
        </linearGradient>
        <linearGradient id={`${uid}-book2front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#b6bcc6" />
        </linearGradient>
        <linearGradient id={`${uid}-book3top`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id={`${uid}-book3front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      <ellipse cx="60" cy="100" rx="80" ry="52" fill={`url(#${uid}-glow)`} />
      <ellipse cx="58" cy="96" rx="38" ry="8" fill="#000" opacity="0.3" />

      {/* bottom book */}
      <g transform="translate(16,62)">
        <path d="M0 10 L44 0 L88 10 L44 20 Z" fill={`url(#${uid}-book1top)`} />
        <path d="M0 10 L44 20 L44 34 L0 24 Z" fill={`url(#${uid}-book1front)`} />
        <path d="M88 10 L44 20 L44 34 L88 24 Z" fill="#4c1d95" />
      </g>

      {/* middle book */}
      <g transform="translate(22,44) rotate(-3 44 12)">
        <path d="M0 10 L44 0 L88 10 L44 20 Z" fill={`url(#${uid}-book2top)`} />
        <path d="M0 10 L44 20 L44 32 L0 22 Z" fill={`url(#${uid}-book2front)`} />
        <path d="M88 10 L44 20 L44 32 L88 22 Z" fill="#9ca3af" />
      </g>

      {/* top book */}
      <g transform="translate(28,28) rotate(4 40 10)">
        <path d="M0 9 L40 0 L80 9 L40 18 Z" fill={`url(#${uid}-book3top)`} />
        <path d="M0 9 L40 18 L40 28 L0 19 Z" fill={`url(#${uid}-book3front)`} />
        <path d="M80 9 L40 18 L40 28 L80 19 Z" fill="#6d28d9" />
        {/* bookmark ribbon */}
        <path d="M60 4 v20 l-4 -4 l-4 4 v-22 Z" fill="#f472b6" />
      </g>
    </svg>
  );
}
