import Link from "next/link";
import { MapPin } from "lucide-react";

const PRODUCT_LINKS = [
  { href: "/#school", label: "სკოლა" },
  { href: "/#features", label: "ინსტრუმენტები" },
  { href: "/#pricing", label: "ფასი" },
];

const COMPANY_LINKS = [
  { href: "/#hero", label: "ჩვენს შესახებ" },
  { href: "/#pricing", label: "კონტაქტი" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#09090f]">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-1.5 text-white">
              <MapPin className="h-4 w-4 text-purple-400" aria-hidden />
              <span className="headline text-lg font-bold">SpaceEdu</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
              შენი პერსონალური სასწავლო სივრცე — სკოლიდან უნივერსიტეტამდე.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-white">პროდუქტი</p>
            <nav className="flex flex-col gap-2.5">
              {PRODUCT_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-gray-500 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-white">კომპანია</p>
            <nav className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-gray-500 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
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
