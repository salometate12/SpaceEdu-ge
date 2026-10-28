"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useTheme, type ThemePreference } from "@/components/ThemeProvider";
import {
  SettingsCard,
  SettingsPageTitle,
  SettingsRows,
  SoonBadge,
  Toggle,
  ToggleRow,
} from "@/components/profile/settings-ui";
import { userStore } from "@/lib/user-data";
import { ANIMATIONS_KEY, ANIMATIONS_UPDATED_EVENT } from "@/lib/user-data-keys";

const THEME_OPTIONS: { value: ThemePreference; label: string; sub: string }[] = [
  { value: "light", label: "ღია", sub: "თეთრი ფონი" },
  { value: "dark", label: "მუქი", sub: "მუქი ფონი" },
  { value: "system", label: "სისტემური", sub: "მოწყობილობის მიხედვით" },
];

/** A tiny page in the theme's colours: a card and two lines of text. */
function MiniPage({ dark }: { dark: boolean }) {
  return (
    <span className={`flex h-full w-full flex-col gap-1.5 p-2.5 ${dark ? "bg-[#0c0c10]" : "bg-[#fafaf9]"}`}>
      <span className={`h-2 w-10 rounded-full ${dark ? "bg-[#3f3f46]" : "bg-[#d6d3d1]"}`} />
      <span
        className={`flex flex-1 flex-col gap-1 rounded-[8px] border p-1.5 ${
          dark ? "border-[#26262e] bg-[#15151b]" : "border-[#ece9e4] bg-white"
        }`}
      >
        <span className="h-1.5 w-8 rounded-full bg-[#ec4899]" />
        <span className={`h-1.5 w-12 rounded-full ${dark ? "bg-[#3f3f46]" : "bg-[#e7e5e4]"}`} />
      </span>
    </span>
  );
}

function ThemePreview({ value }: { value: ThemePreference }) {
  if (value === "system") {
    return (
      <span className="flex h-full w-full">
        <span className="w-1/2 overflow-hidden">
          <span className="block h-full w-[200%]">
            <MiniPage dark={false} />
          </span>
        </span>
        <span className="w-1/2 overflow-hidden">
          <span className="-ml-[100%] block h-full w-[200%]">
            <MiniPage dark />
          </span>
        </span>
      </span>
    );
  }
  return <MiniPage dark={value === "dark"} />;
}

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

  // The choice made on another device, arriving from the account.
  useEffect(() => {
    const sync = () => setAnimations(readAnimationsPref());
    window.addEventListener(ANIMATIONS_UPDATED_EVENT, sync);
    return () => window.removeEventListener(ANIMATIONS_UPDATED_EVENT, sync);
  }, []);

  const toggleAnimations = (next: boolean) => {
    setAnimations(next); // the effect above applies the <html> class
    try {
      userStore.set(ANIMATIONS_KEY, next ? "on" : "off");
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <SettingsPageTitle>გარეგნობა და ენა</SettingsPageTitle>

      <SettingsCard title="თემა" subtitle="როგორ გამოიყურება SpaceEdu">
        <div role="radiogroup" aria-label="თემა" className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const selected = preference === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPreference(opt.value)}
                className={`ps-focus flex min-w-0 flex-col overflow-hidden rounded-[18px] text-left transition-colors ${
                  selected
                    ? "border-2 border-[var(--ps-strong-ring)]"
                    : "border border-[var(--ps-border)] p-px hover:border-[var(--ps-field-border)]"
                }`}
              >
                <span className="block h-20 w-full border-b border-[var(--ps-border)]" aria-hidden>
                  <ThemePreview value={opt.value} />
                </span>
                <span className="flex items-center gap-2 px-3 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold text-[var(--ps-title)]">{opt.label}</span>
                    <span className="hidden truncate text-[12.5px] text-[var(--ps-muted)] sm:block">{opt.sub}</span>
                  </span>
                  {selected ? (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ps-strong-ring)] text-[var(--ps-card)]">
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="მოძრაობა და ხედი" flush>
        <SettingsRows>
          <ToggleRow
            title="ანიმაციები"
            subtitle="ბარათებისა და გადასვლების ეფექტები"
            control={<Toggle checked={animations} onChange={toggleAnimations} label="ანიმაციები" />}
          />
          <ToggleRow title="კომპაქტური ხედი" subtitle="ბარათები უფრო ახლოს, ნაკლები ცარიელი ადგილი" control={<SoonBadge />} muted />
        </SettingsRows>
      </SettingsCard>

      <SettingsCard id="language" title="ენა" subtitle="ინტერფეისისა და AI-ს პასუხების ენა" flush>
        <SettingsRows>
          <div role="radiogroup" aria-label="ინტერფეისის ენა">
            <LanguageRow label="ქართული" selected />
            {/* The interface is Georgian-only for now. */}
            <LanguageRow label="English" soon />
          </div>
        </SettingsRows>
      </SettingsCard>
    </>
  );
}

function LanguageRow({ label, selected = false, soon = false }: { label: string; selected?: boolean; soon?: boolean }) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={soon || undefined}
      className="flex items-center gap-3 border-t border-[var(--ps-divider)] px-5 py-4 first:border-t-0 sm:px-6"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-[#e11d74]" : "border-[var(--ps-field-border)]"
        }`}
        aria-hidden
      >
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#e11d74]" /> : null}
      </span>
      <span className={`flex-1 text-[15px] font-medium text-[var(--ps-title)] ${soon ? "opacity-60" : ""}`}>{label}</span>
      {soon ? <SoonBadge /> : null}
    </div>
  );
}
