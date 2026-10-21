import type { ReactNode } from "react";

/**
 * The card the auth pages share with /login: the logo (dark artwork on the
 * dark card), a title and a line under it. An optional back control sits in
 * the top-left corner.
 */
export function AuthCard({
  title,
  subtitle,
  back,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#121214]/40">
      {back ? <div className="absolute left-4 top-4">{back}</div> : null}
      <header className="space-y-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, as on /login */}
        <img src="/spaceedu-mark.svg" alt="SpaceEdu" width={48} height={48} className="mx-auto h-12 w-12 dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG, as on /login */}
        <img src="/spaceedu-mark-dark.svg" alt="SpaceEdu" width={48} height={48} className="mx-auto hidden h-12 w-12 dark:block" />
        <h1 className="headline text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-600 dark:text-gray-400">{subtitle}</p> : null}
      </header>
      {children}
    </div>
  );
}

export const authInputClass = (invalid: boolean) =>
  `w-full rounded-xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:bg-white/[0.03] dark:text-white dark:placeholder-gray-500 ${
    invalid
      ? "border-rose-500 ring-1 ring-rose-500/40 focus:border-rose-500 focus:ring-rose-500/40 dark:border-rose-500"
      : "border-slate-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 dark:border-white/[0.08]"
  }`;

export const authPrimaryButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 py-3 text-sm font-medium text-white shadow-lg shadow-pink-600/20 hover:bg-pink-500 disabled:opacity-50";

export const authBackClass =
  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white";
