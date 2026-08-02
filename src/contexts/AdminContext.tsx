"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AdminSectionId } from "@/lib/admin/types";
import { DEFAULT_ADMIN_SECTION } from "@/lib/admin/sections";

interface AdminContextValue {
  password: string;
  section: AdminSectionId;
  setSection: (section: AdminSectionId) => void;
  status: string | null;
  error: string | null;
  setStatus: (message: string | null) => void;
  setError: (message: string | null) => void;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  password,
  initialSection = DEFAULT_ADMIN_SECTION,
  children,
}: {
  password: string;
  initialSection?: AdminSectionId;
  children: ReactNode;
}) {
  const [section, setSection] = useState<AdminSectionId>(initialSection);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notifySuccess = useCallback((message: string) => {
    setError(null);
    setStatus(message);
  }, []);

  const notifyError = useCallback((message: string) => {
    setStatus(null);
    setError(message);
  }, []);

  const value = useMemo(
    () => ({
      password,
      section,
      setSection,
      status,
      error,
      setStatus,
      setError,
      notifySuccess,
      notifyError,
    }),
    [password, section, status, error, notifySuccess, notifyError],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
