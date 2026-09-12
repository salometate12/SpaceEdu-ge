"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("spaceedu-pwa-dismissed") === "1") {
      setDismissed(true);
    }

    const register = async () => {
      if (!("serviceWorker" in navigator)) return;
      // No worker in development: it would serve yesterday's chunks over a
      // dev server that rebuilds on every keystroke.
      if (process.env.NODE_ENV === "development") {
        const existing = await navigator.serviceWorker.getRegistrations();
        await Promise.all(existing.map((registration) => registration.unregister()));
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        await registration.update();
      } catch {
        /* install can still work from the browser menu */
      }
    };
    void register();

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setMessage(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    if (isIosDevice() && !isStandalone()) {
      setIosHint(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const hide = () => {
    setDismissed(true);
    setInstallEvent(null);
    setIosHint(false);
    window.localStorage.setItem("spaceedu-pwa-dismissed", "1");
  };

  const install = async () => {
    if (!installEvent) {
      setMessage("ბრაუზერის მენიუში აირჩიე Install SpaceEdu / Add to Home Screen.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      setInstallEvent(null);
      if (outcome === "accepted") {
        hide();
        return;
      }
      setMessage("თუ იასამნისფერი აიქონი უკვე გაქვს, წაშალე და თავიდან დააყენე — გამოჩნდება რაკეტის ლოგო.");
    } catch {
      setMessage("უკვე დაყენებულია. წაშალე ძველი იასამნისფერი აიქონი Dock-იდან / მთავარი ეკრანიდან, მერე თავიდან დააყენე.");
    } finally {
      setBusy(false);
    }
  };

  if (dismissed || isStandalone()) return null;
  if (!installEvent && !iosHint) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[70] w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.18)] sm:bottom-6">
      <div className="flex items-start gap-3">
        <img
          src="/icons/icon-192x192.png"
          alt=""
          width={36}
          height={36}
          className="mt-0.5 h-9 w-9 rounded-[10px]"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--text-primary)]">დააყენე SpaceEdu</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            {iosHint && !installEvent
              ? "Safari-ში დააჭირე Share → Add to Home Screen."
              : "დაამატე მთავარ ეკრანზე — გაიხსნება როგორც აპლიკაცია, SpaceEdu-ს რაკეტის ლოგოთი."}
          </p>
          {message && <p className="mt-2 text-xs leading-relaxed text-amber-700 dark:text-amber-300">{message}</p>}
          {installEvent && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void install()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#7c3aed] px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              {busy ? "იხსნება..." : "დაყენება"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={hide}
          className="rounded-full p-1 text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)]"
          aria-label="დახურვა"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
