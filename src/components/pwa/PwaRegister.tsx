"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("spaceedu-pwa-dismissed") === "1") {
      setDismissed(true);
    }

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore: installability still depends on a successful registration */
      });
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    if (isIosSafari() && !isStandalone()) {
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
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    hide();
  };

  if (dismissed || isStandalone()) return null;
  if (!installEvent && !iosHint) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-[70] w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.18)] sm:bottom-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7c3aed] text-white">
          {iosHint && !installEvent ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--text-primary)]">დააყენე SpaceEdu</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            {installEvent
              ? "დაამატე მთავარ ეკრანზე — გაიხსნება როგორც აპლიკაცია."
              : "Safari-ში დააჭირე Share → Add to Home Screen."}
          </p>
          {installEvent && (
            <button
              type="button"
              onClick={() => void install()}
              className="mt-3 inline-flex rounded-full bg-[#7c3aed] px-3.5 py-1.5 text-xs font-bold text-white"
            >
              დაყენება
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
