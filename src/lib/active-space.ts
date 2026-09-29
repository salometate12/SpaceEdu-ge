import { spaceFromPathname, spaceOwningPath } from "@/lib/access-control";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

/**
 * The working space — which space's menus and links to show right now.
 *
 * Not the same as the account's space (`user_metadata.space`): an admin can
 * work in either space, and routes like /settings/* belong to none, so the
 * account space alone sent an admin who opened /settings from the student
 * profile into the abiturient menu. The working space remembers where the
 * user actually is.
 *
 * It only decides what is *shown*. Access is still enforced by the
 * middleware's space guard against the account space, so a non-admin cannot
 * reach another space's pages by editing this cookie.
 */
export const ACTIVE_SPACE_COOKIE = "spaceedu_active_space";

/** A year: the cookie only remembers a preference, it grants nothing. */
export const ACTIVE_SPACE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseSpace(value: string | null | undefined): SpaceeduSpace | null {
  if (value === "school" || value === "abiturient" || value === "student") return value;
  return null;
}

/**
 * URL space → remembered (cookie) space → account space → null.
 * The same order on the server (layouts) and the client (header, dock).
 */
export function resolveWorkingSpace(input: {
  pathname: string | null | undefined;
  cookieSpace: SpaceeduSpace | null;
  accountSpace: SpaceeduSpace | null;
}): SpaceeduSpace | null {
  const fromUrl = input.pathname ? spaceFromPathname(input.pathname) : null;
  return fromUrl ?? input.cookieSpace ?? input.accountSpace ?? null;
}

/**
 * The space the middleware should remember for this request, or null to
 * leave the cookie alone. Only routes that belong to exactly one space
 * (dashboards, profiles, their stats) count — a shared page never
 * changes it — and nothing is written when it already holds that value.
 */
export function activeSpaceToRemember(
  pathname: string,
  current: string | null | undefined,
): SpaceeduSpace | null {
  const owner = spaceOwningPath(pathname);
  if (!owner || owner === parseSpace(current)) return null;
  return owner;
}

/** Client: the remembered space, if any. */
export function readActiveSpaceCookie(): SpaceeduSpace | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${ACTIVE_SPACE_COOKIE}=`));
  return parseSpace(match ? decodeURIComponent(match.split("=")[1] ?? "") : null);
}

/** Client: forget the remembered space (on sign-out, so a shared device
 * doesn't carry it over to the next account). */
export function clearActiveSpaceCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACTIVE_SPACE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
