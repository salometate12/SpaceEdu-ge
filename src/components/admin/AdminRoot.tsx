"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminProvider } from "@/contexts/AdminContext";
import { DEFAULT_ADMIN_SECTION, isAdminSectionId } from "@/lib/admin/sections";
import type { AdminSectionId } from "@/lib/admin/types";

const SESSION_KEY = "spaceedu-admin-auth";

export function AdminRoot() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) setPassword(stored);
    setReady(true);
  }, []);

  const sectionParam = searchParams.get("section");
  const initialSection: AdminSectionId = isAdminSectionId(sectionParam)
    ? sectionParam
    : DEFAULT_ADMIN_SECTION;

  if (!ready) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center text-sm text-zinc-400">
        Loading admin console...
      </div>
    );
  }

  if (!password) {
    return (
      <AdminPasswordGate
        onAuthenticated={(value) => {
          sessionStorage.setItem(SESSION_KEY, value);
          setPassword(value);
        }}
      />
    );
  }

  return (
    <AdminProvider password={password} initialSection={initialSection}>
      <AdminShell />
    </AdminProvider>
  );
}
