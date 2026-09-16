import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/#audience", label: "სკოლა" },
  { href: "/#features", label: "ინსტრუმენტები" },
  { href: "/#pricing", label: "ფასი" },
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
 * `forceDark` keeps the footer dark regardless of theme — used on the landing,
 * whose ground is dark even in the light theme. Everywhere else the footer is
 * theme-aware, so on a day-mode page it reads light instead of a black slab.
 */
export function LandingFooter({ forceDark = false }: { forceDark?: boolean }) {
  const footerCls = forceDark
    ? "border-t border-white/[0.06] bg-[#09090f]"
    : "border-t border-slate-200 bg-slate-50 dark:border-white/[0.06] dark:bg-[#09090f]";
  const headingCls = forceDark ? "text-white" : "text-slate-900 dark:text-white";
  const taglineCls = forceDark ? "text-gray-500" : "text-slate-500 dark:text-gray-500";
  const linkCls = forceDark
    ? "text-sm text-gray-500 transition-colors hover:text-white"
    : "text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-gray-500 dark:hover:text-white";
  const dividerCls = forceDark
    ? "mt-10 border-t border-white/[0.06] pt-6"
    : "mt-10 border-t border-slate-200 pt-6 dark:border-white/[0.06]";
  const copyCls = forceDark ? "text-gray-600" : "text-slate-400 dark:text-gray-600";

  return (
    <footer className={footerCls}>
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            {forceDark ? (
              // Dark ground: the full logo carries its own wordmark.
              <img
                src="/spaceedu-logo.png"
                alt="SpaceEdu"
                width={72}
                height={72}
                className="h-16 w-auto"
              />
            ) : (
              // Theme-aware: illustration mark reads on either ground, with the
              // wordmark drawn as theme-aware text beside it.
              <div className="flex items-center gap-2.5">
                <img
                  src="/spaceedu-mark.png"
                  alt="SpaceEdu"
                  width={44}
                  height={44}
                  className="h-11 w-auto"
                />
                <span className={`headline text-xl font-bold tracking-tight ${headingCls}`}>
                  SpaceEdu
                </span>
              </div>
            )}
            <p className={`mt-3 max-w-xs text-sm leading-relaxed ${taglineCls}`}>
              შენი პერსონალური სასწავლო სივრცე — სკოლიდან უნივერსიტეტამდე.
            </p>
          </div>

          <div>
            <p className={`mb-3 text-sm font-semibold ${headingCls}`}>პროდუქტი</p>
            <nav className="flex flex-col gap-2.5">
              {PRODUCT_LINKS.map((link) => (
                <FooterNavLink key={link.label} href={link.href} label={link.label} className={linkCls} />
              ))}
            </nav>
          </div>

          <div>
            <p className={`mb-3 text-sm font-semibold ${headingCls}`}>კომპანია</p>
            <nav className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <FooterNavLink key={link.label} href={link.href} label={link.label} className={linkCls} />
              ))}
            </nav>
          </div>
        </div>

        <div className={dividerCls}>
          <p className={`text-xs ${copyCls}`}>
            © {new Date().getFullYear()} SpaceEdu. ყველა უფლება დაცულია.
          </p>
        </div>
      </div>
    </footer>
  );
}
