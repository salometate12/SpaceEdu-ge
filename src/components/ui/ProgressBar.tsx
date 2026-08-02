interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const safe = Math.min(100, Math.max(0, value));
  return (
    <div>
      {label && <p className="mb-2 text-xs text-[var(--text-secondary)]">{label}</p>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
        <div
          className="animated-progress h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
          style={{ width: `${safe}%` }}
        />
      </div>
      <p className="mono mt-2 text-xs text-[var(--text-muted)]">{safe}%</p>
    </div>
  );
}
