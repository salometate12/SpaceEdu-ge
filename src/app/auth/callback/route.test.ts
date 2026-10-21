import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = {
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
};

vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({ auth }),
}));

const { GET } = await import("./route");

const call = async (query: string) => {
  const response = await GET(new Request(`https://spaceedu.test/auth/callback${query}`));
  return response.headers.get("location");
};

describe("/auth/callback", () => {
  beforeEach(() => {
    auth.exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
    auth.verifyOtp.mockReset().mockResolvedValue({ error: null });
  });

  it("keeps the OAuth flow: code → /auth/complete with the role", async () => {
    expect(await call("?code=abc&role=student")).toBe("https://spaceedu.test/auth/complete?role=student");
  });

  it("goes to an internal next after the code exchange", async () => {
    expect(await call("?code=abc&next=/reset-password")).toBe("https://spaceedu.test/reset-password");
  });

  it("ignores next that points to another site", async () => {
    expect(await call("?code=abc&next=https://evil.com")).toBe("https://spaceedu.test/auth/complete?role=abiturient");
    expect(await call("?code=abc&next=//evil.com")).toBe("https://spaceedu.test/auth/complete?role=abiturient");
  });

  it("verifies a token_hash recovery link and opens /reset-password", async () => {
    expect(await call("?token_hash=th&type=recovery")).toBe("https://spaceedu.test/reset-password");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ type: "recovery", token_hash: "th" });
  });

  it("sends a dead recovery link to /reset-password with an error, not to the landing page", async () => {
    auth.verifyOtp.mockResolvedValue({ error: { message: "expired" } });
    expect(await call("?token_hash=th&type=recovery")).toBe("https://spaceedu.test/reset-password?error=link_invalid");
    // PKCE link opened in another browser: the code can't be exchanged there
    auth.exchangeCodeForSession.mockResolvedValue({ error: { message: "code verifier missing" } });
    expect(await call("?code=abc&next=/reset-password")).toBe("https://spaceedu.test/reset-password?error=link_invalid");
    // Supabase's own redirect for an expired link
    expect(await call("?next=/reset-password&error=access_denied&error_code=otp_expired")).toBe(
      "https://spaceedu.test/reset-password?error=link_invalid",
    );
  });

  it("keeps the OAuth error redirect for a failed sign-in", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: { message: "bad" } });
    expect(await call("?code=abc")).toBe("https://spaceedu.test/?error=access_denied&error_code=oauth_failed");
  });
});
