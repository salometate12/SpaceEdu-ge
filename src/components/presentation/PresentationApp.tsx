"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { listPresentations, newPresentationId, type SavedPresentation } from "@/lib/presentation-store";
import { PRESENTATIONS_UPDATED_EVENT } from "@/lib/presentation-sync-client";
import { useUserDataStatus } from "@/hooks/useUserDataStatus";
import { MyPresentations } from "./MyPresentations";
import { PresentationWizard } from "./PresentationWizard";

/**
 * /presentation — „ჩემი პრეზენტაციები“, or the wizard/editor for
 * `?id=…`. With nothing saved yet the wizard opens straight away; its id
 * goes into the URL once it's first saved, so a refresh reopens it and
 * the browser's back button returns to the list.
 */
export function PresentationApp() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const id = params.get("id");
  const [list, setList] = useState<SavedPresentation[] | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  // The id a brand-new wizard saves under before it's in the URL.
  const [pendingId] = useState(newPresentationId);

  const refresh = useCallback(() => {
    listPresentations()
      .then(setList)
      .catch(() => {
        setStorageFailed(true);
        setList([]);
      });
  }, []);

  useEffect(() => {
    if (id) return;
    refresh();
    // The editor saves as it closes; pick that up too.
    const timer = window.setTimeout(refresh, 600);
    // …and the account's presentations, arriving from another device.
    window.addEventListener(PRESENTATIONS_UPDATED_EVENT, refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(PRESENTATIONS_UPDATED_EVENT, refresh);
    };
  }, [id, refresh]);

  // Signed in: kept on the account; otherwise only on this device.
  const onAccount = useUserDataStatus() !== "local";

  const open = (presentationId: string) => router.push(`${pathname}?id=${encodeURIComponent(presentationId)}`);
  const startNew = () => router.push(`${pathname}?id=${newPresentationId()}`);
  const onFirstSave = useCallback(
    (saved: string) => {
      if (!new URLSearchParams(window.location.search).get("id")) router.replace(`${pathname}?id=${encodeURIComponent(saved)}`);
    },
    [pathname, router],
  );

  if (!id && list === null) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-slate-500 dark:text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!id && list && list.length > 0) {
    return <MyPresentations presentations={list} onOpen={open} onNew={startNew} onChanged={refresh} />;
  }

  const wizardId = id ?? pendingId;
  return (
    <div className="space-y-3">
      {id || storageFailed ? null : (
        <p className="text-xs text-slate-500 dark:text-zinc-500">
          ყველაფერი ავტომატურად ინახება {onAccount ? "შენს ანგარიშზე" : "ამ მოწყობილობაზე"} — მერე „ჩემი პრეზენტაციებიდან“ გახსნი.
        </p>
      )}
      {id ? (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="inline-flex items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-slate-600 transition hover:text-pink-700 dark:text-zinc-400 dark:hover:text-pink-300"
        >
          <ArrowLeft className="h-4 w-4" />
          ჩემი პრეზენტაციები
        </button>
      ) : null}
      <PresentationWizard key={wizardId} presentationId={wizardId} onFirstSave={onFirstSave} onNewPresentation={startNew} />
    </div>
  );
}
