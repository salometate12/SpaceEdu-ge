import Link from "next/link";
import { ArrowRight, Layers, Sparkles } from "lucide-react";
import {
  ACCENT_CARD,
  ACCENT_PILL,
  ACCENT_TEXT,
  type NotebookAccent,
} from "@/components/landing/notebook/accents";

interface SubjectSpacePremiumCardProps {
  accent: NotebookAccent;
  href: string;
  title?: string;
  description?: string;
}

/**
 * The "Premium Space" card at the foot of every subject hub. It takes the
 * subject's third notebook accent, so the three coloured blocks on a hub
 * are always three different pens.
 */
export function SubjectSpacePremiumCard({
  accent,
  href,
  title = "მოემზადე ეროვნულებისთვის შენს Space-ზე",
  description = "დამატებითი სავარჯიშოები, ტესტები და AI ანალიზი — ყველაფერი ერთ სივრცეში.",
}: SubjectSpacePremiumCardProps) {
  return (
    <Link
      href={href}
      className={`group block rounded-2xl border-2 p-6 transition-transform duration-300 hover:-translate-y-1 ${ACCENT_CARD[accent]}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-white/70 dark:bg-white/[0.08] ${ACCENT_CARD[accent]} ${ACCENT_TEXT[accent]}`}
          >
            <Sparkles className="h-5 w-5 stroke-[2]" aria-hidden />
          </span>
          <div className="min-w-0">
            <span
              className={`mb-2 inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${ACCENT_PILL[accent]}`}
            >
              <Layers className="h-3 w-3 stroke-[2.5]" aria-hidden />
              Premium Space
            </span>
            <h2 className="text-lg font-bold leading-snug text-slate-900 dark:text-slate-50">
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {description}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border-2 px-4 py-2.5 text-sm font-bold sm:self-center ${ACCENT_PILL[accent]}`}
        >
          გადასვლა
          <ArrowRight className="h-4 w-4 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
