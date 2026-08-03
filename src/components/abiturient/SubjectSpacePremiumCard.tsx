import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Layers, Sparkles } from "lucide-react";
import type { SubjectTheme } from "@/lib/abiturient-subjects";

interface SubjectSpacePremiumCardProps {
  theme: SubjectTheme;
  href: string;
  title?: string;
  description?: string;
}

/**
 * Generic, theme-aware "Premium Space" promo card shown at the bottom of
 * every subject hub. Colors always come from that subject's own theme
 * (the same palette used on the dashboard) so every subject gets its own
 * matching accent instead of one hardcoded color.
 */
export function SubjectSpacePremiumCard({
  theme,
  href,
  title = "მოემზადე ეროვნულებისთვის შენს Space-ზე",
  description = "დამატებითი სავარჯიშოები, ტესტები და AI ანალიზი — ყველაფერი ერთ სივრცეში.",
}: SubjectSpacePremiumCardProps) {
  return (
    <Link
      href={href}
      className={`group relative block cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214]/60 p-6 backdrop-blur-xl transition-all duration-300 ${theme.hoverBorder}`}
      style={{ ["--subject-glow-color" as string]: theme.glow } as CSSProperties}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.14] blur-3xl transition-opacity duration-300 group-hover:opacity-[0.24]"
        style={{ background: "radial-gradient(circle, var(--subject-glow-color) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${theme.iconRing}`}>
            <div
              className="pointer-events-none absolute inset-0 rounded-xl opacity-60 blur-xl"
              style={{ background: "var(--subject-glow-color)" }}
              aria-hidden
            />
            <Sparkles className={`relative h-6 w-6 stroke-[1.5] ${theme.iconText}`} />
          </div>
          <div className="min-w-0">
            <p className={`mb-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${theme.iconText} opacity-80`}>
              <Layers className="h-3 w-3 stroke-[1.5]" />
              Premium Space
            </p>
            <h2 className="text-lg font-semibold leading-snug text-white">{title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-400">{description}</p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border px-4 py-2.5 text-sm font-medium transition-all sm:self-center ${theme.iconRing} ${theme.ctaText}`}
        >
          გადასვლა
          <ArrowRight className="h-4 w-4 stroke-[1.5] transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
