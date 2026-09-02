"use client";

import { useId } from "react";

export function BinderClip({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const handle = `${uid}-handle`;
  const body = `${uid}-body`;
  const shine = `${uid}-shine`;

  return (
    <svg
      viewBox="0 0 72 96"
      className={`drop-shadow-[0_8px_10px_rgba(40,0,20,0.35)] ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={handle} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="45%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="35%" stopColor="#cbd5e1" />
          <stop offset="70%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="45%" stopColor="white" stopOpacity="0.7" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M22 34 C10 12 8 8 16 5 C26 1 30 18 31 36"
        fill="none"
        stroke={`url(#${handle})`}
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M50 34 C62 12 64 8 56 5 C46 1 42 18 41 36"
        fill="none"
        stroke={`url(#${handle})`}
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <rect x="18" y="32" width="36" height="14" rx="7" fill={`url(#${body})`} />
      <rect x="22" y="34.5" width="28" height="5" rx="2.5" fill={`url(#${shine})`} opacity="0.55" />
      <path d="M21 45.5 L17 78 C24 84 48 84 55 78 L51 45.5 Z" fill={`url(#${body})`} />
      <path d="M24 48 L21 76" stroke="white" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M48 48 L51 76" stroke="#334155" strokeOpacity="0.25" strokeWidth="1.5" />
    </svg>
  );
}
