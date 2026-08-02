import fs from "fs";
import path from "path";

const cache = new Map<string, unknown>();

function filePath(storeName: string): string {
  return path.join(process.cwd(), "data", "admin", `${storeName}.json`);
}

export function adminStoreAvailable(storeName: string): boolean {
  try {
    return fs.existsSync(filePath(storeName));
  } catch {
    return false;
  }
}

export function readAdminStore<T>(storeName: string, fallback: T): T {
  const cached = cache.get(storeName);
  if (cached) return cached as T;

  const target = filePath(storeName);
  if (!fs.existsSync(target)) {
    ensureAdminStore(storeName, fallback);
  }

  const raw = fs.readFileSync(target, "utf8");
  const parsed = JSON.parse(raw) as T;
  cache.set(storeName, parsed);
  return parsed;
}

export function writeAdminStore<T>(storeName: string, data: T): void {
  const dir = path.dirname(filePath(storeName));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath(storeName), `${JSON.stringify(data, null, 2)}\n`, "utf8");
  cache.set(storeName, data);
}

export function ensureAdminStore<T>(storeName: string, fallback: T): void {
  const target = filePath(storeName);
  if (fs.existsSync(target)) return;
  writeAdminStore(storeName, fallback);
}

export function clearAdminStoreCache(storeName?: string): void {
  if (storeName) {
    cache.delete(storeName);
    return;
  }
  cache.clear();
}
