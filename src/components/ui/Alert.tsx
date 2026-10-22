import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

type AlertTone = "info" | "success" | "warning" | "error";

const TONE: Record<AlertTone, { box: string; icon: typeof Info }> = {
  info: {
    box: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-100",
    icon: Info,
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-100",
    icon: CheckCircle2,
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100",
    icon: AlertTriangle,
  },
  error: {
    box: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100",
    icon: XCircle,
  },
};

/**
 * A message in the page, in the light style: a thin tinted border, an icon,
 * text and optional controls. Errors are announced (`role="alert"`), the
 * rest politely (`role="status"`).
 */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  className = "",
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  /** Buttons or a select under the text. */
  action?: ReactNode;
  className?: string;
}) {
  const { box, icon: Icon } = TONE[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-[14px] border px-4 py-3 text-[14px] leading-relaxed ${box} ${className}`}>
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 opacity-80" aria-hidden />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div> : null}
        {action ? <div className="mt-2.5 flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
    </div>
  );
}

/** A field's own error, under it; link it with `aria-describedby`. */
export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-[13px] font-medium text-rose-600 dark:text-rose-400">
      {children}
    </p>
  );
}
