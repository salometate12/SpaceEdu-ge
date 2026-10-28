"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { psButton, SettingsCard, SettingsPageTitle } from "@/components/profile/settings-ui";
import { ConfirmDialog } from "@/components/profile/settings/ConfirmDialog";
import { SpaceAvatar } from "@/components/profile/SpaceAvatar";
import { Toast } from "@/components/ui/Toast";
import { AVATAR_ACCEPT, AVATAR_ERRORS, avatarFileProblem } from "@/lib/avatar";
import { removeAvatar, uploadAvatar } from "@/lib/avatar-upload";
import { useCurrentUserAvatar } from "@/hooks/useCurrentUserAvatar";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  bio: string;
  city: string;
  institution: string;
}

type SaveState = "idle" | "saving" | "error";

const FIELDS: (keyof ProfileFormValues)[] = ["firstName", "lastName", "bio", "city", "institution"];

function sameValues(a: ProfileFormValues, b: ProfileFormValues): boolean {
  return FIELDS.every((key) => a[key].trim() === b[key].trim());
}

export function SettingsProfileForm({
  initial,
  email,
  initials,
  customPhotoUrl = null,
  providerPhotoUrl = null,
  space = null,
}: {
  initial: ProfileFormValues;
  /** The working space: names the school / university field and tints the initials. */
  space?: SpaceeduSpace | null;
  email: string;
  initials: string;
  /** The user's own uploaded photo. */
  customPhotoUrl?: string | null;
  /** Google's photo, shown when there's no own photo. */
  providerPhotoUrl?: string | null;
}) {
  const [values, setValues] = useState<ProfileFormValues>(initial);
  // What's on the account: „გაუქმება“ goes back to it, and „შენახვა“ waits for a change from it.
  const [saved, setSaved] = useState<ProfileFormValues>(initial);
  const [state, setState] = useState<SaveState>("idle");
  const [toast, setToast] = useState(false);
  const closeToast = useCallback(() => setToast(false), []);
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

  const set = (key: keyof ProfileFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (state === "error") setState("idle");
  };
  const dirty = !sameValues(values, saved);

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
      setSaved(values);
      setState("idle");
      setToast(true);
    } catch {
      setState("error");
    }
  };

  const studentSpace = space === "student";

  return (
    <>
      <SettingsPageTitle>პროფილი</SettingsPageTitle>

      <SettingsCard title="ფოტო" subtitle="ჩანს პროფილის მენიუში და გვერდით მენიუში">
        <div className="flex flex-wrap items-center gap-5">
          <span className="relative">
            <SpaceAvatar
              space={space}
              initials={initials}
              photoUrl={shownPhoto}
              className="h-[72px] w-[72px] rounded-full text-[24px]"
            />
            {photoBusy ? (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white" aria-label="მიმდინარეობს…">
                <Loader2 className="h-5 w-5 animate-spin" />
              </span>
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
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
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy !== null}
                className={psButton("secondary")}
              >
                {photoBusy === "uploading" ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
                {photoBusy === "uploading" ? "იტვირთება…" : "ფოტოს ატვირთვა"}
              </button>
              {ownPhoto ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={photoBusy !== null}
                  className={psButton("ghost")}
                >
                  <Trash2 aria-hidden />
                  წაშლა
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[13px] text-[var(--ps-muted)]">JPG, PNG ან WEBP, მაქსიმუმ 5 MB</p>
            {photoError ? (
              <p role="alert" className="mt-1 text-[13px] font-medium text-[var(--ps-danger)]">
                {photoError}
              </p>
            ) : null}
          </div>
        </div>
      </SettingsCard>
      <ConfirmDialog
        open={confirmDelete}
        title="წავშალოთ პროფილის ფოტო?"
        message={googlePhoto ? "ატვირთული ფოტო წაიშლება და Google-ის ფოტო დაბრუნდება." : "ატვირთული ფოტო წაიშლება და მის ნაცვლად ინიციალები გამოჩნდება."}
        confirmLabel="წაშლა"
        danger
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />

      <SettingsCard title="პირადი ინფორმაცია" subtitle="სახელი, კონტაქტი და რამდენიმე სიტყვა შენზე">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="ps-label">სახელი</span>
              <input className="ps-field" autoComplete="given-name" value={values.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="ps-label">გვარი</span>
              <input className="ps-field" autoComplete="family-name" value={values.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="ps-label">ელ-ფოსტა</span>
              <input className="ps-field" value={email} type="email" readOnly aria-readonly="true" />
            </label>
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="ps-label">ბიო</span>
              <textarea
                className="ps-field"
                placeholder="რამდენიმე სიტყვა შენს შესახებ"
                value={values.bio}
                onChange={(e) => set("bio", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="ps-label">ქალაქი</span>
              <input className="ps-field" placeholder="თბილისი" value={values.city} onChange={(e) => set("city", e.target.value)} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="ps-label">{studentSpace ? "უნივერსიტეტი" : "სკოლა"}</span>
              <input
                className="ps-field"
                placeholder={studentSpace ? "მაგ. თსუ" : "მაგ. 51-ე საჯარო სკოლა"}
                value={values.institution}
                onChange={(e) => set("institution", e.target.value)}
              />
            </label>
          </div>

          {state === "error" && (
            <p role="alert" className="mt-4 text-[13.5px] font-medium text-[var(--ps-danger)]">
              ვერ შევინახე. სცადე თავიდან.
            </p>
          )}

          <div className="ps-actions mt-6">
            <button type="button" onClick={() => setValues(saved)} disabled={!dirty || state === "saving"} className={psButton("secondary")}>
              გაუქმება
            </button>
            <button type="submit" disabled={!dirty || state === "saving"} className={psButton("primary")}>
              {state === "saving" ? "ინახება…" : "შენახვა"}
            </button>
          </div>
        </form>
      </SettingsCard>

      {toast ? <Toast message="შენახულია" onClose={closeToast} duration={3000} /> : null}
    </>
  );
}
