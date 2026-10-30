"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { WizardPage } from "@/components/ui/wizard/WizardPage";
import { listPresentations, newPresentationId, type SavedPresentation } from "@/lib/presentation-store";
import { PRESENTATIONS_UPDATED_EVENT } from "@/lib/presentation-sync-client";
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
  // The id a brand-new wizard saves under before it's in the URL.
  const [pendingId] = useState(newPresentationId);

  const refresh = useCallback(() => {
    listPresentations()
      .then(setList)
      .catch(() => setList([]));
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

  // „✓ შენახულია“ beside the title for two seconds after each save.
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<number | null>(null);
  const onSaved = useCallback(() => {
    setSavedFlash(true);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setSavedFlash(false), 2000);
  }, []);
  useEffect(() => () => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
  }, []);

  const open = (presentationId: string) => router.push(`${pathname}?id=${encodeURIComponent(presentationId)}`);
  const startNew = () => router.push(`${pathname}?id=${newPresentationId()}`);
  const onFirstSave = useCallback(
    (saved: string) => {
      if (!new URLSearchParams(window.location.search).get("id")) router.replace(`${pathname}?id=${encodeURIComponent(saved)}`);
    },
    [pathname, router],
  );

  const page = (actions: React.ReactNode, children: React.ReactNode) => (
    <WizardPage
      title="პრეზენტაციის გენერატორი"
      subtitle="მიუთითე თემა და AI წამებში მოგიმზადებს სლაიდებს და ტექსტს"
      backHref="/dashboard-student"
      actions={actions}
    >
      {children}
    </WizardPage>
  );

  if (!id && list === null) {
    return page(
      null,
      <div className="flex min-h-[30vh] items-center justify-center text-[var(--wz-muted)]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>,
    );
  }

  if (!id && list && list.length > 0) {
    return page(null, <MyPresentations presentations={list} onOpen={open} onNew={startNew} onChanged={refresh} />);
  }

  const wizardId = id ?? pendingId;
  return page(
    <>
      {savedFlash ? (
        <span role="status" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#f0fdf4] px-3.5 text-[13.5px] font-semibold text-[#166534] dark:bg-[rgba(74,222,128,0.12)] dark:text-[#86efac]">
          <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          შენახულია
        </span>
      ) : null}
      {id ? (
        <Link href={pathname} className="wz-secondary h-10 px-4 text-[14px]">
          ჩემი პრეზენტაციები
        </Link>
      ) : null}
    </>,
    <PresentationWizard key={wizardId} presentationId={wizardId} onFirstSave={onFirstSave} onNewPresentation={startNew} onSaved={onSaved} />,
  );
}
