import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent-primary)] text-white hover:bg-[color-mix(in_oklab,var(--accent-primary),white_8%)]",
  secondary:
    "bg-[var(--accent-secondary)] text-slate-950 hover:bg-[color-mix(in_oklab,var(--accent-secondary),white_8%)]",
  ghost:
    "border border-[var(--border-hover)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-white",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`btn-glow inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
