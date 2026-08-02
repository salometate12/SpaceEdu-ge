"use client";

import { useState } from "react";
import { Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminPasswordGateProps {
  onAuthenticated: (password: string) => void;
}

export function AdminPasswordGate({ onAuthenticated }: AdminPasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Incorrect password");
        return;
      }

      sessionStorage.setItem("spaceedu-admin-auth", password);
      onAuthenticated(password);
    } catch {
      setError("Could not verify password. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="admin-panel w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="admin-icon-wrap">
            <Shield className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="admin-kicker">SpaceEdu Admin</p>
            <h1 className="text-xl font-bold text-white">Secure Access</h1>
          </div>
        </div>

        <p className="mb-6 text-sm text-zinc-400">
          Enter the admin password to manage university handbook data.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-cyan-300/80">
              Password
            </span>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/70"
                strokeWidth={1.75}
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="admin-input w-full pl-10"
                placeholder="Admin password"
                autoComplete="current-password"
                required
              />
            </div>
          </label>

          {error ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Verifying..." : "Enter Dashboard"}
          </Button>
        </form>
      </div>
    </div>
  );
}
