"use client";

import { Shield } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/sections";
import { CalculatorDataSection } from "./sections/CalculatorDataSection";
import { QuizManagerSection } from "./sections/QuizManagerSection";
import { SystemSettingsSection } from "./sections/SystemSettingsSection";

function SectionContent() {
  const { section } = useAdmin();

  switch (section) {
    case "quiz":
      return <QuizManagerSection />;
    case "settings":
      return <SystemSettingsSection />;
    case "calculator":
    default:
      return <CalculatorDataSection />;
  }
}

export function AdminShell() {
  const { section, setSection, status, error } = useAdmin();
  const active = ADMIN_NAV_ITEMS.find((item) => item.id === section) ?? ADMIN_NAV_ITEMS[0];

  return (
    <div className="admin-shell flex min-h-screen">
      <aside className="admin-sidebar hidden w-64 shrink-0 flex-col border-r border-cyan-500/15 bg-[#070a12]/95 p-5 lg:flex">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="admin-icon-wrap">
              <Shield className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="admin-kicker">SpaceEdu</p>
              <h1 className="text-lg font-bold text-white">Master Control</h1>
            </div>
          </div>
          <p className="text-xs text-zinc-500">Private admin console</p>
        </div>

        <nav className="space-y-2">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`admin-nav-item w-full ${isActive ? "admin-nav-item-active" : ""}`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-zinc-400">
          JSON stores under <span className="font-mono text-cyan-300/80">data/admin/</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-topbar border-b border-cyan-500/10 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="admin-kicker lg:hidden">SpaceEdu Master Control</p>
              <h2 className="text-xl font-bold text-white">{active.label}</h2>
              <p className="text-sm text-zinc-400">{active.description}</p>
            </div>

            <nav className="flex gap-2 lg:hidden">
              {ADMIN_NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    section === item.id
                      ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                      : "border border-white/10 text-zinc-400"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          {status ? (
            <p className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {status}
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <SectionContent />
        </main>
      </div>
    </div>
  );
}
