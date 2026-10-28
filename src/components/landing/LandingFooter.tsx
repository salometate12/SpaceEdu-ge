import Link from "next/link";
import "./landing.css";

const PRODUCT_LINKS = [
  { href: "/#audience", label: "სკოლა" },
  { href: "/#features", label: "ხელსაწყოები" },
  { href: "/#pricing", label: "ფასები" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "ჩვენს შესახებ" },
  { href: "/contact", label: "კონტაქტი" },
  { href: "/privacy", label: "კონფიდენციალურობა" },
  { href: "/terms", label: "წესები და პირობები" },
];

/**
 * A footer nav link. In-page anchors (`/#…`) render as a plain <a> so the
 * browser does its native hash scroll — which honours scroll-padding-top and,
 * unlike a same-page Next <Link>, actually moves. Route links keep <Link>.
 */
function FooterNavLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}) {
  if (href.startsWith("/#")) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

/**
 * The site footer, in the light style and following the theme everywhere —
 * the landing included: the page's ground with a thin line above it.
 */
export function LandingFooter() {
  const linkCls = "ld-focus rounded-sm text-[14.5px] text-[var(--ld-text)] transition-colors hover:text-[var(--ld-title)]";

  return (
    <footer className="landing-footer border-t border-[var(--ld-card-border)] bg-[var(--ld-bg)]">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            {/* The full logo carries its own wordmark; each theme its artwork. */}
            <img src="/spaceedu-logo.svg" alt="SpaceEdu" width={143} height={44} className="h-11 w-auto dark:hidden" />
            <img src="/spaceedu-logo-dark.svg" alt="SpaceEdu" width={143} height={44} className="hidden h-11 w-auto dark:block" />
            <p className="mt-3 max-w-xs text-[14.5px] leading-relaxed text-[var(--ld-muted)]">
              შენი სასწავლო სივრცე სკოლიდან უნივერსიტეტამდე.
            </p>
          </div>

          <div>
            <p className="mb-3 text-[14.5px] font-semibold text-[var(--ld-title)]">პროდუქტი</p>
            <nav className="flex flex-col gap-2.5">
              {PRODUCT_LINKS.map((link) => (
                <FooterNavLink key={link.label} href={link.href} label={link.label} className={linkCls} />
              ))}
            </nav>
          </div>

          <div>
            <p className="mb-3 text-[14.5px] font-semibold text-[var(--ld-title)]">კომპანია</p>
            <nav className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <FooterNavLink key={link.label} href={link.href} label={link.label} className={linkCls} />
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t border-[var(--ld-card-border)] pt-6">
          <p className="text-[13px] text-[var(--ld-muted)]">© {new Date().getFullYear()} SpaceEdu. ყველა უფლება დაცულია.</p>
        </div>
      </div>
    </footer>
  );
}
