import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

export function Card({ title, subtitle, className = "", children }: CardProps) {
  return (
    <section className={`card ${className}`}>
      {(title || subtitle) && (
        <header className="mb-4">
          {title && <h2 className="headline text-lg font-semibold">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
