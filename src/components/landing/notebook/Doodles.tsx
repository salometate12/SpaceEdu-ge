/**
 * Hand-drawn margin doodles for the About page.
 *
 * Inline SVG rather than an icon set: these are decorations in the spirit
 * of things scribbled next to notes, so they want round caps, uneven
 * angles and their own colours. Every one is `aria-hidden` — none of them
 * carry meaning the copy doesn't already state.
 */

interface DoodleProps {
  className?: string;
}

export function RainbowArc({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 66" fill="none" aria-hidden className={className}>
      <g strokeWidth="7" strokeLinecap="round">
        <path d="M8 60 A52 52 0 0 1 112 60" stroke="#f87171" />
        <path d="M16 60 A44 44 0 0 1 104 60" stroke="#fb923c" />
        <path d="M24 60 A36 36 0 0 1 96 60" stroke="#fbbf24" />
        <path d="M32 60 A28 28 0 0 1 88 60" stroke="#34d399" />
        <path d="M40 60 A20 20 0 0 1 80 60" stroke="#60a5fa" />
      </g>
    </svg>
  );
}

export function Sparkle({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        d="M12 0c1 8 4 11 12 12-8 1-11 4-12 12-1-8-4-11-12-12C8 11 11 8 12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Flower({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <g fill="currentColor" opacity="0.9">
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse key={angle} cx="24" cy="13" rx="6" ry="11" transform={`rotate(${angle} 24 24)`} />
        ))}
      </g>
      <circle cx="24" cy="24" r="5.5" fill="#fbbf24" />
    </svg>
  );
}

export function Ruler({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 68 22" fill="none" aria-hidden className={className}>
      <rect
        x="2"
        y="2.5"
        width="64"
        height="17"
        rx="4"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M14 2.5v6" />
        <path d="M24 2.5v9" />
        <path d="M34 2.5v6" />
        <path d="M44 2.5v9" />
        <path d="M54 2.5v6" />
      </g>
    </svg>
  );
}

export function Pencil({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={className}>
      <path
        d="M11 29 31 9l8 8-20 20z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M6 42l3-11 8 8z" fill="currentColor" />
      <path d="M28 12l8 8" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Sun({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={className}>
      <circle cx="24" cy="24" r="8.5" stroke="currentColor" strokeWidth="2.6" />
      <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M24 4v6" />
        <path d="M24 38v6" />
        <path d="M4 24h6" />
        <path d="M38 24h6" />
        <path d="M10 10l4.5 4.5" />
        <path d="M33.5 33.5L38 38" />
        <path d="M38 10l-4.5 4.5" />
        <path d="M14.5 33.5L10 38" />
      </g>
    </svg>
  );
}

export function Mountains({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 96 44" fill="none" aria-hidden className={className}>
      <circle cx="74" cy="13" r="7" stroke="#fbbf24" strokeWidth="2.6" />
      <path
        d="M4 40l20-26 12 15 10-13 18 24z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M2 40h92" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Bulb({ className = "" }: DoodleProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M9 17.5h6M10 20.5h4M12 2.5a6.5 6.5 0 0 0-3.7 11.8c.5.4.7.9.7 1.4v.3h6v-.3c0-.5.2-1 .7-1.4A6.5 6.5 0 0 0 12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
