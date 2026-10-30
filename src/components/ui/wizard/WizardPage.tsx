import type { ReactNode } from "react";
import { BackButton } from "@/components/ui/BackButton";
import "./wizard.css";

/**
 * A step-by-step tool page: the back button, a 30px title and its line,
 * something on the right (a link, a saved chip), then the steps and the
 * form beside a sticky panel (hidden below 1024px).
 */
export function WizardPage({
  title,
  subtitle,
  backHref,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  /** Where „უკან“ goes when the previous page isn't on this site. */
  backHref: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="wz under-site-header min-h-dvh max-md:-mt-[var(--safe-top)] max-md:-mb-36 max-md:pb-36">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-[240px] pt-[calc(var(--safe-top)+16px)] sm:px-6 md:pb-16 md:pt-10 lg:px-14">
        <header className="flex flex-wrap items-start gap-3 sm:gap-4">
          <BackButton fallbackHref={backHref} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[24px] font-bold leading-tight tracking-tight text-[var(--wz-title)] sm:text-[30px]">{title}</h1>
            <p className="mt-1 text-[14.5px] text-[var(--wz-muted)] sm:text-[15px]">{subtitle}</p>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2 max-sm:w-full">{actions}</div> : null}
        </header>
        <div className="mt-6 flex flex-col gap-5">{children}</div>
      </div>
    </div>
  );
}

/** The form card and the sticky panel beside it (the panel only from 1024px). */
export function WizardColumns({ form, panel }: { form: ReactNode; panel?: ReactNode }) {
  return (
    <div className="flex items-start gap-5">
      <div className="wz-card min-w-0 flex-[1.55] p-5 sm:p-8">{form}</div>
      {panel ? (
        <aside className="sticky top-24 hidden min-w-0 flex-1 rounded-[28px] bg-[var(--wz-panel)] p-6 lg:block">{panel}</aside>
      ) : null}
    </div>
  );
}
