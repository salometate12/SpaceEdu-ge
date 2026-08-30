"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ParsedAuthError {
  code: string | null;
}

function parseAuthError(): ParsedAuthError | null {
  if (typeof window === "undefined") return null;

  const hashRaw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const searchRaw = window.location.search.startsWith("?")
    ? window.location.search.slice(1)
    : "";

  const hashParams = new URLSearchParams(hashRaw);
  const searchParams = new URLSearchParams(searchRaw);

  const error = hashParams.get("error") ?? searchParams.get("error");
  if (!error) return null;

  return {
    code: hashParams.get("error_code") ?? searchParams.get("error_code"),
  };
}

const ERROR_MESSAGES: Record<string, string> = {
  otp_expired:
    "დადასტურების ბმულის ვადა ამოიწურა ან უკვე გამოყენებულია. დარეგისტრირდი თავიდან იმავე ელ-ფოსტით — ახალი ბმული გამოგეგზავნება.",
};

const DEFAULT_ERROR_MESSAGE =
  "დადასტურების ბმულთან დაფიქსირდა შეცდომა. დარეგისტრირდი თავიდან იმავე ელ-ფოსტით — ახალი ბმული გამოგეგზავნება.";

export function AuthErrorNotice() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const parsed = parseAuthError();
      if (!parsed) return;
      setMessage(parsed.code && ERROR_MESSAGES[parsed.code] ? ERROR_MESSAGES[parsed.code] : DEFAULT_ERROR_MESSAGE);
      window.history.replaceState(null, "", window.location.pathname);
    };
    sync();
  }, []);

  if (!message) return null;

  return (
    <div className="relative z-20 mx-auto w-full max-w-3xl px-4 pt-4">
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100/90 backdrop-blur-xl">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5] text-amber-400" aria-hidden />
        <div className="flex-1">
          <p className="leading-relaxed">{message}</p>
          <Link
            href="/select-space"
            className="mt-1 inline-block text-xs font-medium text-amber-300 underline underline-offset-2 hover:text-amber-200"
          >
            რეგისტრაციაზე გადასვლა
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setMessage(null)}
          className="shrink-0 rounded-md p-1 text-amber-300/70 transition-colors hover:bg-white/5 hover:text-amber-200"
          aria-label="დახურვა"
        >
          <X className="h-4 w-4 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
}
