"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdmin } from "@/contexts/AdminContext";
import { ADMIN_PASSWORD_HEADER } from "@/lib/admin/constants";
import type { AdminSettings } from "@/lib/admin/types";

export function SystemSettingsSection() {
  const { password, notifySuccess, notifyError } = useAdmin();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/data/settings", {
        headers: { [ADMIN_PASSWORD_HEADER]: password },
      });
      const payload = (await response.json()) as AdminSettings & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Failed to load settings");
      setSettings(payload);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [password, notifyError]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/data/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_PASSWORD_HEADER]: password,
        },
        body: JSON.stringify(settings),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        data?: AdminSettings;
        error?: string;
      };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Save failed");
      setSettings(payload.data ?? settings);
      notifySuccess("System settings saved to data/admin/settings.json (runtime overrides active).");
    } catch (error) {
      notifyError(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="admin-panel p-8 text-center text-sm text-zinc-400">
        Loading system settings...
      </div>
    );
  }

  return (
    <div className="admin-panel p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">System Settings</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Update platform configuration and AI provider keys without redeploying. Keys saved here
          override environment variables at runtime.
        </p>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">
            Site Configuration
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs text-zinc-400">Site Name</span>
              <input
                className="admin-input w-full"
                value={settings.siteName}
                onChange={(event) =>
                  setSettings((current) => ({ ...current!, siteName: event.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-zinc-400">Support Email</span>
              <input
                className="admin-input w-full"
                value={settings.supportEmail}
                onChange={(event) =>
                  setSettings((current) => ({ ...current!, supportEmail: event.target.value }))
                }
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-2 block text-xs text-zinc-400">Site Tagline</span>
            <input
              className="admin-input w-full"
              value={settings.siteTagline}
              onChange={(event) =>
                setSettings((current) => ({ ...current!, siteTagline: event.target.value }))
              }
            />
          </label>
          <label className="block max-w-xs">
            <span className="mb-2 block text-xs text-zinc-400">Maintenance Mode</span>
            <select
              className="admin-input w-full"
              value={settings.maintenanceMode ? "true" : "false"}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current!,
                  maintenanceMode: event.target.value === "true",
                }))
              }
            >
              <option value="false">Off</option>
              <option value="true">On</option>
            </select>
          </label>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">
            AI Provider Keys
          </h3>
          <p className="text-xs text-zinc-500">
            Leave a field blank or unchanged (masked) to keep the current key. New keys take effect
            immediately for AI routes.
          </p>
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-xs text-zinc-400">Google Generative AI API Key</span>
              <input
                type="password"
                className="admin-input w-full font-mono"
                value={settings.ai.googleGenerativeAiApiKey}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current!,
                    ai: { ...current!.ai, googleGenerativeAiApiKey: event.target.value },
                  }))
                }
                placeholder="Enter new Gemini key"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-zinc-400">OpenAI API Key</span>
              <input
                type="password"
                className="admin-input w-full font-mono"
                value={settings.ai.openaiApiKey}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current!,
                    ai: { ...current!.ai, openaiApiKey: event.target.value },
                  }))
                }
                placeholder="Enter new OpenAI key"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-zinc-400">Anthropic API Key</span>
              <input
                type="password"
                className="admin-input w-full font-mono"
                value={settings.ai.anthropicApiKey}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current!,
                    ai: { ...current!.ai, anthropicApiKey: event.target.value },
                  }))
                }
                placeholder="Enter new Anthropic key"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">
            AI Models & Failover
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs text-zinc-400">Provider Order</span>
              <input
                className="admin-input w-full font-mono"
                value={settings.ai.providerOrder}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current!,
                    ai: { ...current!.ai, providerOrder: event.target.value },
                  }))
                }
                placeholder="gemini,openai,anthropic"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-zinc-400">Gemini Model</span>
              <input
                className="admin-input w-full font-mono"
                value={settings.ai.geminiModel}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current!,
                    ai: { ...current!.ai, geminiModel: event.target.value },
                  }))
                }
                placeholder="gemini-2.0-flash"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-zinc-400">OpenAI Model</span>
              <input
                className="admin-input w-full font-mono"
                value={settings.ai.openaiModel}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current!,
                    ai: { ...current!.ai, openaiModel: event.target.value },
                  }))
                }
                placeholder="gpt-4o-mini"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs text-zinc-400">Anthropic Model</span>
              <input
                className="admin-input w-full font-mono"
                value={settings.ai.anthropicModel}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current!,
                    ai: { ...current!.ai, anthropicModel: event.target.value },
                  }))
                }
                placeholder="claude-3-5-haiku-20241022"
              />
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" strokeWidth={1.75} />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
