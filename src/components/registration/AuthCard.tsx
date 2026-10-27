import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { RegistrationRoleParam } from "@/lib/registration-role";
import "./auth.css";

/**
 * The page every auth screen sits on: the plain ground, a top bar (back to
 * the landing, the logo, the theme) and the card under it — not centred in
 * the window, so phones start at the top.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page flex min-h-dvh flex-col gap-6 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] pt-[calc(var(--safe-top)+16px)] max-md:-mt-[var(--safe-top)] sm:gap-10 sm:px-6 sm:pb-12 sm:pt-7">
      <AuthTopBar />
      {children}
    </main>
  );
}

function AuthTopBar() {
  return (
    <header className="mx-auto grid w-full max-w-[1080px] grid-cols-[1fr_auto_1fr] items-center">
      <Link
        href="/"
        aria-label="მთავარი"
        className="auth-focus inline-flex h-10 items-center justify-center gap-1.5 justify-self-start rounded-full border border-[var(--au-button-border)] bg-[var(--au-card)] text-[14px] font-semibold text-[var(--au-title)] transition-colors hover:border-[var(--au-muted)] max-sm:w-10 sm:px-4"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        <span className="max-sm:hidden">მთავარი</span>
      </Link>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
        <img src="/spaceedu-mark.svg" alt="" width={32} height={32} className="h-7 w-7 sm:h-8 sm:w-8 dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
        <img src="/spaceedu-mark-dark.svg" alt="" width={32} height={32} className="hidden h-7 w-7 sm:h-8 sm:w-8 dark:block" />
        <span className="headline text-[16px] font-bold tracking-tight text-[var(--au-title)] sm:text-[18px]">SpaceEdu</span>
      </div>
      <ThemeToggle className="auth-focus !h-10 !w-10 justify-self-end !border-[var(--au-button-border)] !bg-[var(--au-card)]" />
    </header>
  );
}

/**
 * The card: on wider screens a plain white (or dark) card, 440px wide; on
 * phones no box at all — the form sits on the page and the footer line
 * drops to the bottom.
 */
export function AuthCard({
  title,
  subtitle,
  back,
  chip,
  eyebrow,
  footer,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: ReactNode;
  /** The space chip above the title. */
  chip?: ReactNode;
  /** A small line above the title („ნაბიჯი 2 / 2“). */
  eyebrow?: string;
  /** „ანგარიში არ გაქვს? …“ under the card's content. */
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto flex w-full max-w-[440px] flex-1 flex-col gap-[26px] sm:mt-[clamp(0px,6vh,64px)] sm:flex-none sm:gap-6 sm:rounded-[24px] sm:border sm:border-[var(--au-card-border)] sm:bg-[var(--au-card)] sm:p-8">
      {back ? <div className="-mb-2">{back}</div> : null}
      <header>
        {chip ? <div className="mb-4">{chip}</div> : null}
        {eyebrow ? <p className="mb-1.5 text-[12.5px] font-semibold text-[var(--au-muted)]">{eyebrow}</p> : null}
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-[var(--au-title)] sm:text-[28px]">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--au-muted)]">{subtitle}</p> : null}
      </header>
      {children}
      {footer ? <p className="text-center text-[14px] text-[var(--au-muted)] max-sm:mt-auto">{footer}</p> : null}
    </section>
  );
}

const SPACE_CHIP: Record<RegistrationRoleParam, { label: string; box: string; dot: string }> = {
  student: { label: "სტუდენტის სივრცე", box: "bg-[var(--au-student-bg)] text-[var(--au-student)]", dot: "bg-[#ec4899]" },
  abiturient: { label: "აბიტურიენტის სივრცე", box: "bg-[var(--au-abit-bg)] text-[var(--au-abit)]", dot: "bg-[#facc15]" },
};

/** „● სტუდენტის სივრცე [შეცვლა]“ — the space the form is for. */
export function AuthSpaceChip({ role }: { role: RegistrationRoleParam }) {
  const look = SPACE_CHIP[role];
  return (
    <div className={`inline-flex h-[30px] items-center gap-2 rounded-full pl-3 pr-1 text-[13px] font-semibold ${look.box}`}>
      <span aria-hidden className={`h-2 w-2 rounded-full ${look.dot}`} />
      {look.label}
      <Link
        href="/select-space"
        className="auth-focus inline-flex h-[22px] items-center rounded-full bg-white px-2.5 text-[12px] font-semibold text-[var(--au-title)] dark:bg-white/10"
      >
        შეცვლა
      </Link>
    </div>
  );
}

/** The „ან“ line between Google and the form. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3" role="separator">
      <div className="h-px flex-1 bg-[var(--au-divider)]" />
      <span className="text-[13px] text-[var(--au-muted)]">ან</span>
      <div className="h-px flex-1 bg-[var(--au-divider)]" />
    </div>
  );
}

/** The input look; the invalid state comes from `aria-invalid`. */
export const authInputClass = (invalid: boolean) => `auth-input${invalid ? " auth-input-invalid" : ""}`;

/** The left icon inside a field. */
export const authIconClass = (invalid: boolean) =>
  `pointer-events-none absolute left-4 top-1/2 z-[1] h-[18px] w-[18px] -translate-y-1/2 ${invalid ? "text-rose-500" : "text-[var(--au-muted)]"}`;

export const authLabelClass = "text-[13px] font-semibold text-[var(--au-text)]";

export const authLinkClass = "auth-focus rounded-sm font-semibold text-[var(--au-link)] underline-offset-4 hover:underline";

export const authPrimaryButtonClass =
  "auth-focus flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[var(--au-primary)] text-[15px] font-semibold text-white transition-colors hover:bg-[var(--au-primary-hover)] disabled:opacity-60";

export const authSecondaryButtonClass =
  "auth-focus flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-[var(--au-button-border)] bg-[var(--au-google)] text-[15px] font-semibold text-[var(--au-title)] transition-colors hover:border-[var(--au-muted)] disabled:cursor-not-allowed disabled:opacity-60";

export const authBackClass =
  "auth-focus inline-flex items-center gap-1 rounded-full text-[13px] font-semibold text-[var(--au-muted)] transition-colors hover:text-[var(--au-title)]";

/** The card's shape while the form loads. */
export function AuthCardSkeleton() {
  return (
    <div
      aria-hidden
      className="mx-auto h-[440px] w-full max-w-[440px] animate-pulse rounded-[24px] border border-[var(--au-card-border)] bg-[var(--au-card)] sm:mt-[clamp(0px,6vh,64px)]"
    />
  );
}
