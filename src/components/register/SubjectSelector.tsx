"use client";

interface SubjectSelectorProps {
  items: readonly string[];
  selected: string[];
  onToggle: (item: string) => void;
  accent?: "purple" | "cyan" | "green";
}

const ACCENT = {
  purple: {
    selected: "border-[#7C3AED] bg-[#1a0a2e] text-[#c4b5fd]",
  },
  cyan: {
    selected: "border-[#22d3ee] bg-[#042f3d] text-[#67e8f9]",
  },
  green: {
    selected: "border-[#22c55e] bg-[#052e16] text-[#86efac]",
  },
} as const;

export function SubjectSelector({
  items,
  selected,
  onToggle,
  accent = "purple",
}: SubjectSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => {
        const active = selected.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={`rounded-lg border px-2.5 py-2 text-left text-sm transition ${
              active
                ? ACCENT[accent].selected
                : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

