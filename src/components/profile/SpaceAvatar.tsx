import type { SpaceeduSpace } from "@/lib/space-back-navigation";

/** The space's colours for an initial: student pink, abiturient yellow. */
export function spaceTint(space: SpaceeduSpace | null | undefined): string {
  return space === "abiturient" || space === "school"
    ? "bg-[var(--ps-abit-bg)] text-[var(--ps-abit)]"
    : "bg-[var(--ps-student-bg)] text-[var(--ps-student)]";
}

/** The user's photo, or their initials in the space's colours. Size and shape come from `className`. */
export function SpaceAvatar({
  space,
  initials,
  photoUrl,
  className = "",
}: {
  space: SpaceeduSpace | null | undefined;
  initials: string;
  photoUrl?: string | null;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden font-bold ${spaceTint(space)} ${className}`}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- user photo from Storage / Google
        <img src={photoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials || "მე"
      )}
    </span>
  );
}
