import { LiteraryParallelsCompactCard } from "@/components/abiturient/georgian/LiteraryParallelsFeature";

/**
 * Compact feature grid for /subject/georgian — mirrors space hub card styling.
 */
export function GeorgianSubjectPageModules() {
  return (
    <section
      className="mx-auto w-full max-w-4xl px-4 pb-10 sm:px-6"
      aria-label="ლიტერატურული მოდულები"
    >
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        საგამოცდო რესურსები
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LiteraryParallelsCompactCard backContext="hub" />
      </div>
    </section>
  );
}
