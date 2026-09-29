import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ACTIVE_SPACE_COOKIE } from "@/lib/active-space";

/**
 * The real middleware, with Supabase's session lookup replaced by whichever
 * user a test puts in `session.user`. Covers the four kinds of account the
 * working-space change touches: an admin, a normal student, a normal
 * abiturient, and a Google account that never recorded a space.
 */
const session: { user: Record<string, unknown> | null } = { user: null };

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: session.user } }) },
  }),
}));

const { middleware } = await import("../middleware");

const ADMIN = { email: "salo.tateshvili@gmail.com", user_metadata: { space: "abiturient" } };
const STUDENT = { email: "student@example.com", user_metadata: { space: "student" } };
const ABITURIENT = { email: "abit@example.com", user_metadata: { space: "abiturient" } };
const GOOGLE_NO_SPACE = { email: "google@example.com", user_metadata: { full_name: "G" } };

function request(path: string, cookie?: string): NextRequest {
  const headers = cookie ? { cookie: `${ACTIVE_SPACE_COOKIE}=${cookie}` } : undefined;
  return new NextRequest(new URL(path, "https://spaceedu.test"), { headers });
}

function remembered(response: Response): string | null {
  const header = response.headers.get("set-cookie") ?? "";
  const match = header.match(new RegExp(`${ACTIVE_SPACE_COOKIE}=([^;]*)`));
  return match ? match[1] : null;
}

function redirectPath(response: Response): string | null {
  const location = response.headers.get("location");
  return location ? new URL(location).pathname : null;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
  vi.stubEnv("PAYWALL_ENABLED", "false");
});

afterEach(() => {
  vi.unstubAllEnvs();
  session.user = null;
});

describe("middleware — admin", () => {
  beforeEach(() => {
    session.user = ADMIN;
  });

  it("remembers the student space when the admin opens the student dashboard", async () => {
    const response = await middleware(request("/dashboard-student", "abiturient"));
    expect(redirectPath(response)).toBeNull();
    expect(remembered(response)).toBe("student");
  });

  it("switches back when the admin opens the abiturient profile", async () => {
    const response = await middleware(request("/profile-abiturient", "student"));
    expect(redirectPath(response)).toBeNull();
    expect(remembered(response)).toBe("abiturient");
  });

  it("leaves the cookie alone on /settings, so the menu stays in the student space", async () => {
    const response = await middleware(request("/settings/profile", "student"));
    expect(redirectPath(response)).toBeNull();
    expect(remembered(response)).toBeNull();
  });
});

describe("middleware — normal student", () => {
  beforeEach(() => {
    session.user = STUDENT;
  });

  it("lets them into their profile and remembers it", async () => {
    const response = await middleware(request("/profile"));
    expect(redirectPath(response)).toBeNull();
    expect(remembered(response)).toBe("student");
  });

  it("still redirects them away from the abiturient profile — the cookie grants nothing", async () => {
    const response = await middleware(request("/profile-abiturient", "abiturient"));
    expect(redirectPath(response)).toBe("/profile");
    expect(remembered(response)).toBeNull();
  });

  it("still redirects them away from the abiturient dashboard", async () => {
    const response = await middleware(request("/dashboard-abit"));
    expect(redirectPath(response)).toBe("/dashboard-student");
  });
});

describe("middleware — normal abiturient", () => {
  beforeEach(() => {
    session.user = ABITURIENT;
  });

  it("redirects them away from the student profile and stats", async () => {
    expect(redirectPath(await middleware(request("/profile", "student")))).toBe("/profile-abiturient");
    expect(redirectPath(await middleware(request("/profile/stats")))).toBe("/profile-abiturient");
  });

  it("remembers their own space from their dashboard", async () => {
    const response = await middleware(request("/dashboard-abit", "student"));
    expect(redirectPath(response)).toBeNull();
    expect(remembered(response)).toBe("abiturient");
  });
});

describe("middleware — Google account with no space", () => {
  beforeEach(() => {
    session.user = GOOGLE_NO_SPACE;
  });

  it("remembers the space they actually used, so /settings can link back to it", async () => {
    const response = await middleware(request("/dashboard-student"));
    expect(redirectPath(response)).toBeNull();
    expect(remembered(response)).toBe("student");
  });

  it("is not redirected from /settings", async () => {
    expect(redirectPath(await middleware(request("/settings/profile", "student")))).toBeNull();
  });
});

describe("middleware — signed out", () => {
  it("sends a private page to the chooser without writing a cookie", async () => {
    const response = await middleware(request("/profile"));
    expect(redirectPath(response)).toBe("/select-space");
    expect(remembered(response)).toBeNull();
  });
});

describe("middleware — local development", () => {
  it("keeps the dev bypass (no auth) but still remembers the space", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await middleware(request("/profile-abiturient"));
    expect(redirectPath(response)).toBeNull();
    expect(remembered(response)).toBe("abiturient");
  });
});
