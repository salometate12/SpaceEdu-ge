import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminRoot } from "@/components/admin/AdminRoot";

export const metadata: Metadata = {
  title: "Admin — SpaceEdu",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-theme dark min-h-screen bg-[#05070f] text-zinc-100">
      <Suspense
        fallback={
          <div className="admin-shell flex min-h-screen items-center justify-center text-sm text-zinc-400">
            Loading admin console...
          </div>
        }
      >
        <AdminRoot />
      </Suspense>
      {children}
    </div>
  );
}
