"use client";

export type PasswordStrengthLevel = "weak" | "medium" | "strong";

export function checkStrength(password: string): PasswordStrengthLevel {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return "weak";
  if (score === 2) return "medium";
  return "strong";
}

const STYLES: Record<PasswordStrengthLevel, { label: string; cls: string }> = {
  weak: { label: "სუსტი", cls: "border-[#f472b6] bg-[#3b1028] text-[#f9a8d4]" },
  medium: { label: "საშუალო", cls: "border-[#f59e0b] bg-[#2d1a00] text-[#fcd34d]" },
  strong: { label: "ძლიერი", cls: "border-[#22c55e] bg-[#052e16] text-[#86efac]" },
};

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const level = checkStrength(password);
  const style = STYLES[level];
  return (
    <div className="mt-2 inline-flex items-center gap-2 text-xs">
      <span className="text-[var(--text-muted)]">პაროლის სიძლიერე:</span>
      <span className={`rounded-md border px-2 py-0.5 ${style.cls}`}>{style.label}</span>
    </div>
  );
}

