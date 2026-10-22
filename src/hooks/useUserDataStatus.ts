"use client";

import { useSyncExternalStore } from "react";
import { getUserStore } from "@/lib/user-data";
import type { SyncStatus } from "@/lib/user-store";

const subscribe = (listener: () => void) => getUserStore().subscribeStatus(listener);
const read = () => getUserStore().status();
const serverStatus = (): SyncStatus => "local";

/** Where the user's data stands: local only, syncing, synced, offline or error. */
export function useUserDataStatus(): SyncStatus {
  return useSyncExternalStore(subscribe, read, serverStatus);
}
