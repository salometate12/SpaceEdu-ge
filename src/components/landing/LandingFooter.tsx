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
function FooterNavLink({ href, label }: { href: string; label: string }) {
  const className = "text-sm text-gray-500 transition-colors hover:text-white";
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

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#09090f]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            {/* The logo carries the wordmark, so no separate text. */}
            <img
              src="/spaceedu-logo.png"
              alt="SpaceEdu"
              width={72}
              height={72}
              className="h-16 w-auto"
            />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
              შენი პერსონალური სასწავლო სივრცე — სკოლიდან უნივერსიტეტამდე.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-white">პროდუქტი</p>
            <nav className="flex flex-col gap-2.5">
              {PRODUCT_LINKS.map((link) => (
                <FooterNavLink key={link.label} href={link.href} label={link.label} />
              ))}
            </nav>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-white">კომპანია</p>
            <nav className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <FooterNavLink key={link.label} href={link.href} label={link.label} />
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t border-white/[0.06] pt-6">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} SpaceEdu. ყველა უფლება დაცულია.
          </p>
        </div>
      </div>
    </footer>
  );
}
