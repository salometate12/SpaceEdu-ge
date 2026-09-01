import Link from "next/link";

const quickLinks = [
  { href: "/select-space", label: "დაფა" },
  { href: "/pricing", label: "ფასები" },
  { href: "/study-plan", label: "სასწავლო გეგმა" },
  { href: "/quiz", label: "Quiz" },
  { href: "/ai-teacher", label: "AI მასწავლებელი" },
];

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-[var(--border)] bg-[color:var(--header-scrolled-bg)] backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="headline text-base font-semibold text-[var(--text-primary)]">
            SpaceEdu
          </p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--text-secondary)]">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-[var(--text-primary)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} SpaceEdu. ყველა უფლება დაცულია.
        </p>
      </div>
    </footer>
  );
}
