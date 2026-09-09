import { LiteraryParallelsCompactCard } from "@/components/abiturient/georgian/LiteraryParallelsFeature";

/**
 * Compact feature grid for /subject/georgian — mirrors the hub's cards.
 */
export function GeorgianSubjectPageModules() {
  return (
    <section
      className="mx-auto w-full max-w-4xl px-4 pb-10 sm:px-6"
      aria-label="ლიტერატურული მოდულები"
    >
      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        საგამოცდო რესურსები
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LiteraryParallelsCompactCard backContext="hub" />
      </div>
    </section>
  );
}
