import fs from "fs";
import path from "path";
import {
  createSupabaseAdminClient,
  HANDBOOK_ROW_KEY,
  isSupabaseStorageConfigured,
} from "@/lib/supabase/admin-server";
import type { HandbookData } from "./types";

let cached: HandbookData | null = null;

function handbookFilePath(): string {
  return path.join(process.cwd(), "data", "universities.json");
}

function loadHandbookFromFile(): HandbookData | null {
  try {
    if (!fs.existsSync(handbookFilePath())) return null;
    const raw = fs.readFileSync(handbookFilePath(), "utf8");
    return JSON.parse(raw) as HandbookData;
  } catch {
    return null;
  }
}

function saveHandbookToFile(data: HandbookData): void {
  fs.writeFileSync(handbookFilePath(), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function loadHandbookFromSupabase(): Promise<HandbookData | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("platform_data")
    .select("data")
    .eq("key", HANDBOOK_ROW_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase handbook read failed: ${error.message}`);
  }

  if (!data?.data) return null;
  return data.data as HandbookData;
}

async function saveHandbookToSupabase(data: HandbookData): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("platform_data").upsert(
    {
      key: HANDBOOK_ROW_KEY,
      data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(`Supabase handbook write failed: ${error.message}`);
  }
}

export function clearHandbookCache(): void {
  cached = null;
}

/** Load handbook: Supabase (if configured) → bundled JSON file fallback. */
export async function loadHandbook(): Promise<HandbookData> {
  if (cached) return cached;

  if (isSupabaseStorageConfigured()) {
    const fromDb = await loadHandbookFromSupabase();
    if (fromDb) {
      cached = fromDb;
      return fromDb;
    }
  }

  const fromFile = loadHandbookFromFile();
  if (!fromFile) {
    throw new Error("University handbook not found in Supabase or data/universities.json");
  }

  cached = fromFile;
  return fromFile;
}

/** Persist handbook to Supabase when configured, otherwise local file (dev only). */
export async function saveHandbook(data: HandbookData): Promise<void> {
  if (isSupabaseStorageConfigured()) {
    await saveHandbookToSupabase(data);
    cached = data;
    return;
  }

  try {
    saveHandbookToFile(data);
    cached = data;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Write failed";
    if (message.includes("EROFS") || message.includes("read-only")) {
      throw new Error(
        "Cannot write handbook on this host. Configure Supabase (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) and run the platform_data migration.",
      );
    }
    throw error;
  }
}

export async function handbookAvailable(): Promise<boolean> {
  if (isSupabaseStorageConfigured()) {
    try {
      const fromDb = await loadHandbookFromSupabase();
      if (fromDb) return true;
    } catch {
      // fall through to file check
    }
  }

  try {
    return fs.existsSync(handbookFilePath());
  } catch {
    return false;
  }
}

/** One-time seed helper: copy bundled JSON into Supabase. */
export async function seedHandbookToSupabase(source?: HandbookData): Promise<void> {
  if (!isSupabaseStorageConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const payload = source ?? loadHandbookFromFile();
  if (!payload) {
    throw new Error("No handbook JSON found to seed.");
  }

  await saveHandbookToSupabase(payload);
  cached = payload;
}
