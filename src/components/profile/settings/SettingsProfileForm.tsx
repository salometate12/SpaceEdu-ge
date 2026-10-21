"use client";

import { useRef, useState } from "react";
import { Check, IdCard, Loader2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { SETTINGS_TONE, SettingsCard } from "@/components/profile/settings-ui";
import { ConfirmDialog } from "@/components/profile/settings/ConfirmDialog";
import { AVATAR_ACCEPT, AVATAR_ERRORS, avatarFileProblem } from "@/lib/avatar";
import { removeAvatar, uploadAvatar } from "@/lib/avatar-upload";
import { useCurrentUserAvatar } from "@/hooks/useCurrentUserAvatar";
import { nbButtonClass } from "@/lib/nb-button";

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  bio: string;
  city: string;
  institution: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function SettingsProfileForm({
  initial,
  email,
  initials,
  customPhotoUrl = null,
  providerPhotoUrl = null,
}: {
  initial: ProfileFormValues;
  email: string;
  initials: string;
  /** The user's own uploaded photo. */
  customPhotoUrl?: string | null;
  /** Google's photo, shown when there's no own photo. */
  providerPhotoUrl?: string | null;
}) {
  const [values, setValues] = useState<ProfileFormValues>(initial);
  const [state, setState] = useState<SaveState>("idle");
  // The live account (follows uploads); the server's values until it loads.
  const liveAvatar = useCurrentUserAvatar();
  const ownPhoto = liveAvatar.loaded ? liveAvatar.customPhotoUrl : customPhotoUrl;
  const googlePhoto = liveAvatar.loaded ? liveAvatar.providerPhotoUrl : providerPhotoUrl;
  const [photoBusy, setPhotoBusy] = useState<"uploading" | "deleting" | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const shownPhoto = ownPhoto ?? googlePhoto;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = avatarFileProblem(file);
    if (problem) {
      setPhotoError(problem);
      return;
    }
    if (!isSupabaseBrowserConfigured()) {
      setPhotoError(AVATAR_ERRORS.failed);
      return;
    }
    setPhotoError(null);
    setPhotoBusy("uploading");
    try {
      await uploadAvatar(createClient(), file); // announces the change; liveAvatar reloads
    } catch {
      setPhotoError(AVATAR_ERRORS.failed);
    } finally {
      setPhotoBusy(null);
    }
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    setPhotoError(null);
    setPhotoBusy("deleting");
    try {
      await removeAvatar(createClient());
    } catch {
      setPhotoError(AVATAR_ERRORS.deleteFailed);
    } finally {
      setPhotoBusy(null);
    }
  };

  const set = (key: keyof ProfileFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!isSupabaseBrowserConfigured()) {
      setState("error");
      return;
    }
    setState("saving");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          bio: values.bio.trim(),
          city: values.city.trim(),
          institution: values.institution.trim(),
        },
      });
      if (error) throw error;
      setState("saved");
    } catch {
      setState("error");
    }
  };

  const fieldClass = `w-full rounded-lg border border-[var(--border-hover)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none ${SETTINGS_TONE.fieldFocus}`;
  const labelClass =
    "text-[11px] uppercase tracking-[0.04em] text-[var(--text-secondary)]";

  return (
    <SettingsCard bodyClassName="p-0">
      {/* Avatar block */}
      <div className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] px-4 py-5 sm:px-5">
        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#0f0f14] bg-[var(--bg-secondary)] text-[22px] font-semibold text-[var(--text-primary)] dark:border-[#f4f4f5]">
          {shownPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- user photo from Storage / Google
            <img src={shownPhoto} alt="პროფილის ფოტო" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            initials || "მე"
          )}
          {photoBusy ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white" aria-label="მიმდინარეობს…">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
          ) : null}
        </span>
        <div className="min-w-[12rem] flex-1">
          <div className="truncate text-[15px] font-medium text-[var(--text-primary)]">
            {[values.firstName, values.lastName].filter(Boolean).join(" ") || "მომხმარებელი"}
          </div>
          <div className="text-xs text-[var(--text-secondary)] [overflow-wrap:anywhere]">{email || "—"}</div>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_ACCEPT}
              hidden
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoBusy !== null}
              className={nbButtonClass({ variant: "primary", size: "sm" })}
            >
              {photoBusy === "uploading" ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
              {photoBusy === "uploading" ? "იტვირთება…" : "ფოტოს ატვირთვა"}
            </button>
            {ownPhoto ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={photoBusy !== null}
                className={nbButtonClass({ variant: "secondary", size: "sm" })}
              >
                <Trash2 aria-hidden />
                წაშლა
              </button>
            ) : null}
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--text-secondary)]">JPG, PNG ან WEBP · მაქს. 5 MB</p>
          {photoError ? (
            <p role="alert" className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
              {photoError}
            </p>
          ) : null}
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title="წავშალოთ პროფილის ფოტო?"
        message={googlePhoto ? "ატვირთული ფოტო წაიშლება და Google-ის ფოტო დაბრუნდება." : "ატვირთული ფოტო წაიშლება და მის ნაცვლად ინიციალები გამოჩნდება."}
        confirmLabel="წაშლა"
        danger
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Fields */}
      <div className="p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-medium text-[var(--text-primary)]">
          <IdCard className={`h-4 w-4 stroke-[1.75] ${SETTINGS_TONE.headingIcon}`} aria-hidden />
          პირადი ინფო
        </h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">სახელი, კონტაქტი და ბიო</p>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>სახელი</span>
            <input className={fieldClass} value={values.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>გვარი</span>
            <input className={fieldClass} value={values.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>ელ-ფოსტა</span>
            <input
              className={`${fieldClass} cursor-not-allowed opacity-70`}
              value={email}
              type="email"
              readOnly
              aria-readonly="true"
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>ბიო</span>
            <textarea
              className={`${fieldClass} min-h-[70px] resize-y`}
              placeholder="რამდენიმე სიტყვა შენს შესახებ..."
              value={values.bio}
              onChange={(e) => set("bio", e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>ქალაქი</span>
            <input className={fieldClass} placeholder="თბილისი" value={values.city} onChange={(e) => set("city", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>სკოლა / უნივ.</span>
            <input className={fieldClass} placeholder="სახელი" value={values.institution} onChange={(e) => set("institution", e.target.value)} />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={state === "saving"}
          className={nbButtonClass({ variant: "primary", block: true, className: "mt-5" })}
        >
          <Check aria-hidden />
          {state === "saving" ? "ინახება..." : "ცვლილებების შენახვა"}
        </button>

        {state === "saved" && (
          <p role="status" className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
            ცვლილებები შენახულია
          </p>
        )}
        {state === "error" && (
          <p role="alert" className="mt-2 text-center text-xs font-medium text-rose-600 dark:text-rose-400">
            ვერ შევინახე. სცადე თავიდან.
          </p>
        )}
      </div>
    </SettingsCard>
  );
}
