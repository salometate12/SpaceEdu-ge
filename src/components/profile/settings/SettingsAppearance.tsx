"use client";

import { useEffect, useState } from "react";
import { Flame, LayoutTemplate, Palette, Sparkles } from "lucide-react";
import { useTheme, type ThemePreference } from "@/components/ThemeProvider";
import { SettingsCard, SoonBadge, Toggle, ToggleRow } from "@/components/profile/settings-ui";

const ANIMATIONS_KEY = "spaceedu-animations";

const THEME_OPTIONS: { value: ThemePreference; label: string; preview: string }[] = [
  { value: "dark", label: "მუქი", preview: "bg-[#0D0D12]" },
  { value: "light", label: "ღია", preview: "bg-[#F8FAFC]" },
  { value: "system", label: "სისტემა", preview: "bg-[var(--bg-secondary)]" },
];

function readAnimationsPref(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ANIMATIONS_KEY) !== "off";
  } catch {
    return true;
  }
}

export function SettingsAppearance() {
  const { preference, setPreference } = useTheme();
  const [animations, setAnimations] = useState(readAnimationsPref);

  // Keep the <html> class in sync with the toggle (DOM side effect only — no
  // setState here, so the state-in-effect rule stays satisfied).
  useEffect(() => {
    document.documentElement.classList.toggle("no-animations", !animations);
  }, [animations]);

  const toggleAnimations = (next: boolean) => {
    setAnimations(next); // the effect above applies the <html> class
    try {
      localStorage.setItem(ANIMATIONS_KEY, next ? "on" : "off");
    } catch {
      /* ignore */
    }
  };

  return (
    <SettingsCard icon={Palette} title="თემა" subtitle="ვიზუალური სტილი" bodyClassName="pt-3">
      <div className="grid grid-cols-3 gap-2">
        {THEME_OPTIONS.map((opt) => {
          const selected = preference === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setPreference(opt.value)}
              className={`rounded-xl border p-2.5 text-center transition-colors ${
                selected ? "border-2 border-[#7F77DD]" : "border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <span
                className={`mb-2 block h-10 rounded-lg border border-[var(--border)] ${opt.preview}`}
                aria-hidden
              />
              <span
                className={`text-xs ${selected ? "font-medium text-[#7F77DD]" : "text-[var(--text-secondary)]"}`}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="-mx-5 mt-4 -mb-5 border-t border-[var(--border)]">
        <ToggleRow
          icon={Sparkles}
          tone="purple"
          title="ანიმაციები"
          subtitle="ბარათებისა და გადასვლის ეფექტები"
          control={<Toggle checked={animations} onChange={toggleAnimations} label="ანიმაციები" />}
        />
        <ToggleRow
          icon={LayoutTemplate}
          tone="teal"
          title="კომპაქტური ხედი"
          subtitle="ბარათები ახლოს, ნაკლები whitespace"
          control={<SoonBadge />}
        />
        <ToggleRow
          icon={Flame}
          tone="amber"
          title="სტრიქის ცეცხლი"
          subtitle="სტრიქ-მთვლელზე ეფექტი"
          control={<SoonBadge />}
        />
      </div>
    </SettingsCard>
  );
}
