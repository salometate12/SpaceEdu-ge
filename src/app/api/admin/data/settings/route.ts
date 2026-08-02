import { NextResponse } from "next/server";
import { getPasswordFromRequest, unauthorizedResponse, verifyAdminPassword } from "@/lib/admin/auth";
import { defaultSettingsStore } from "@/lib/admin/default-stores";
import {
  clearAdminSettingsCache,
  loadAdminSettings,
  saveAdminSettings,
} from "@/lib/admin/load-settings";
import { refreshAdminRuntimeSettings } from "@/lib/admin/bootstrap-settings";
import { ensureAdminStore } from "@/lib/admin/json-store";
import type { AdminSettings } from "@/lib/admin/types";
import { resetLlmClients } from "@/lib/ai/llm-providers";

const STORE = "settings";

function assertAuthorized(request: Request) {
  const password = getPasswordFromRequest(request);
  if (!verifyAdminPassword(password)) return unauthorizedResponse();
  return null;
}

function maskKey(value: string): string {
  if (!value.trim()) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

function sanitizeForClient(settings: AdminSettings): AdminSettings {
  return {
    ...settings,
    ai: {
      ...settings.ai,
      googleGenerativeAiApiKey: maskKey(settings.ai.googleGenerativeAiApiKey),
      openaiApiKey: maskKey(settings.ai.openaiApiKey),
      anthropicApiKey: maskKey(settings.ai.anthropicApiKey),
    },
  };
}

export async function GET(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  ensureAdminStore(STORE, defaultSettingsStore());
  const settings = loadAdminSettings();
  return NextResponse.json(sanitizeForClient(settings));
}

export async function PUT(request: Request) {
  const authError = assertAuthorized(request);
  if (authError) return authError;

  let incoming: AdminSettings;
  try {
    incoming = (await request.json()) as AdminSettings;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const current = loadAdminSettings();

  const mergeKey = (next: string, prev: string) => {
    const trimmed = next.trim();
    if (!trimmed || trimmed.includes("••••")) return prev;
    return trimmed;
  };

  const merged: AdminSettings = {
    siteName: incoming.siteName?.trim() || current.siteName,
    siteTagline: incoming.siteTagline?.trim() || current.siteTagline,
    maintenanceMode: Boolean(incoming.maintenanceMode),
    supportEmail: incoming.supportEmail?.trim() || current.supportEmail,
    meta: current.meta,
    ai: {
      googleGenerativeAiApiKey: mergeKey(
        incoming.ai.googleGenerativeAiApiKey,
        current.ai.googleGenerativeAiApiKey,
      ),
      openaiApiKey: mergeKey(incoming.ai.openaiApiKey, current.ai.openaiApiKey),
      anthropicApiKey: mergeKey(
        incoming.ai.anthropicApiKey,
        current.ai.anthropicApiKey,
      ),
      providerOrder: incoming.ai.providerOrder?.trim() || current.ai.providerOrder,
      geminiModel: incoming.ai.geminiModel?.trim() || current.ai.geminiModel,
      openaiModel: incoming.ai.openaiModel?.trim() || current.ai.openaiModel,
      anthropicModel: incoming.ai.anthropicModel?.trim() || current.ai.anthropicModel,
    },
  };

  saveAdminSettings(merged);
  clearAdminSettingsCache();
  refreshAdminRuntimeSettings();
  resetLlmClients();

  return NextResponse.json({
    ok: true,
    data: sanitizeForClient(loadAdminSettings()),
  });
}
