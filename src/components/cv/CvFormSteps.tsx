"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Globe, GraduationCap, Mail, Phone, Plus, Sparkles, User, Wrench, X } from "lucide-react";
import { StepSection, TONES } from "@/components/ui/wizard/StepSection";
import { ChoiceChips, Field, IconInput, Switch, TagInput } from "@/components/ui/wizard/fields";
import type { CvLanguage } from "@/lib/cv-data";
import { emptyExperience, MAX_EXPERIENCES, type CvExperience } from "@/lib/cv-experience";

export const SOFT_SKILLS = ["გუნდური მუშაობა", "პრობლემების გადაჭრა", "კომუნიკაცია", "დროის მართვა", "სწრაფი სწავლა", "ლიდერობა"];

const YEAR_MIN = 1980;

/** A plausible e-mail, or an empty field (it's optional to fill as you go). */
export function emailProblem(value: string): string | null {
  const email = value.trim();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? null : "ელფოსტა ასე უნდა იყოს: name@mail.com";
}

export function yearProblem(value: string, now: Date = new Date()): string | null {
  const text = value.trim();
  if (!text) return null;
  const year = Number(text);
  const max = now.getFullYear() + 8;
  return Number.isInteger(year) && year >= YEAR_MIN && year <= max ? null : `წელი ${YEAR_MIN}-დან ${max}-მდე`;
}

/* ---------- Step 1 ---------- */

export function ContactStep({
  values,
  onChange,
  photo,
  onPhoto,
}: {
  values: { fullName: string; email: string; phone: string; portfolio: string };
  onChange: (key: "fullName" | "email" | "phone" | "portfolio", value: string) => void;
  photo: string | null;
  onPhoto: (photo: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError = emailTouched ? emailProblem(values.email) : null;

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPhoto(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  return (
    <StepSection icon={User} tone={TONES.pink} title="კონტაქტი და ფოტო" subtitle="როგორ დაგიკავშირდნენ დამსაქმებლები">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
        <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={photo ? "ფოტოს შეცვლა" : "ფოტოს დამატება"}
              className="wz-focus flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 overflow-hidden rounded-full border-[1.5px] border-dashed border-[#e7d3dc] bg-[#fffbfd] text-[#db2777] sm:h-[116px] sm:w-[116px] dark:border-[rgba(236,72,153,0.35)] dark:bg-[rgba(236,72,153,0.06)] dark:text-[#f472b6]"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- local data URL
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <Camera className="h-6 w-6" strokeWidth={1.8} aria-hidden />
                  <span className="text-[13px] font-semibold max-sm:hidden">ფოტო</span>
                </>
              )}
            </button>
            {photo ? (
              <div className="absolute -top-1.5 left-1/2 flex -translate-x-1/2 gap-1 max-sm:hidden">
                <button type="button" onClick={() => fileRef.current?.click()} className="wz-secondary h-7 px-2.5 text-[12px]">
                  შეცვლა
                </button>
                <button type="button" onClick={() => onPhoto(null)} aria-label="ფოტოს წაშლა" className="wz-secondary h-7 w-7 text-[12px]">
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ) : null}
          </div>
          <div className="sm:text-center">
            <p className="text-[15px] font-semibold text-[var(--wz-title)] sm:hidden">{photo ? "ფოტო დამატებულია" : "დაამატე ფოტო"}</p>
            <p className="text-[13px] text-[var(--wz-faint)]">არასავალდებულო</p>
            {photo ? (
              <div className="mt-1 flex gap-3 text-[13px] font-semibold sm:hidden">
                <button type="button" onClick={() => fileRef.current?.click()} className="wz-focus rounded-sm text-[#be185d] dark:text-[#f9a8d4]">
                  შეცვლა
                </button>
                <button type="button" onClick={() => onPhoto(null)} className="wz-focus rounded-sm text-[var(--wz-muted)]">
                  წაშლა
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="სრული სახელი" htmlFor="cv-name" className="sm:col-span-2">
            <input id="cv-name" autoComplete="name" value={values.fullName} onChange={(e) => onChange("fullName", e.target.value)} placeholder="მაგ. ნინო ბერიძე" className="wz-input" />
          </Field>
          <Field label="ელფოსტა" htmlFor="cv-email" error={emailError} errorId="cv-email-error">
            <IconInput
              icon={Mail}
              id="cv-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="name@mail.com"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "cv-email-error" : undefined}
            />
          </Field>
          <Field label="ტელეფონი" htmlFor="cv-phone">
            <IconInput icon={Phone} id="cv-phone" type="tel" autoComplete="tel" inputMode="tel" value={values.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="5XX XX XX XX" />
          </Field>
          <Field label="LinkedIn ან პორტფოლიო" optional htmlFor="cv-link" className="sm:col-span-2">
            <IconInput icon={Globe} id="cv-link" type="url" inputMode="url" value={values.portfolio} onChange={(e) => onChange("portfolio", e.target.value)} placeholder="linkedin.com/in/…" />
          </Field>
        </div>
      </div>
    </StepSection>
  );
}

/* ---------- Step 2 ---------- */

export function EducationStep({
  values,
  onChange,
  experiences,
  onExperiences,
}: {
  values: { university: string; degree: string; graduationYear: string };
  onChange: (key: "university" | "degree" | "graduationYear", value: string) => void;
  experiences: CvExperience[];
  onExperiences: (next: CvExperience[]) => void;
}) {
  const yearError = yearProblem(values.graduationYear);
  const maxYear = new Date().getFullYear() + 8;
  const setEntry = (index: number, key: keyof CvExperience, value: string) =>
    onExperiences(experiences.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)));

  return (
    <StepSection icon={GraduationCap} tone={TONES.blue} title="განათლება და გამოცდილება" subtitle="სად სწავლობ და რა გაგიკეთებია">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <Field label="უნივერსიტეტი" htmlFor="cv-uni">
          <input id="cv-uni" value={values.university} onChange={(e) => onChange("university", e.target.value)} placeholder="მაგ. თბილისის სახელმწიფო უნივერსიტეტი" className="wz-input" />
        </Field>
        <Field label="დამთავრების წელი" htmlFor="cv-year" error={yearError} errorId="cv-year-error">
          <input
            id="cv-year"
            type="number"
            inputMode="numeric"
            min={YEAR_MIN}
            max={maxYear}
            value={values.graduationYear}
            onChange={(e) => onChange("graduationYear", e.target.value)}
            placeholder={String(new Date().getFullYear() + 1)}
            aria-invalid={Boolean(yearError)}
            aria-describedby={yearError ? "cv-year-error" : undefined}
            className="wz-input"
          />
        </Field>
        <Field label="ფაკულტეტი და ხარისხი" htmlFor="cv-degree" className="sm:col-span-2">
          <input id="cv-degree" value={values.degree} onChange={(e) => onChange("degree", e.target.value)} placeholder="მაგ. კომპიუტერული მეცნიერება, ბაკალავრი" className="wz-input" />
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="text-[16px] font-bold text-[var(--wz-title)]">გამოცდილება</h3>
          <span className="text-[13px] text-[var(--wz-faint)]">სამსახური, სტაჟირება, პროექტი ან მოხალისეობა</span>
        </div>
        {experiences.map((entry, index) => (
          <div key={index} className="relative flex flex-col gap-3 rounded-[20px] border border-[var(--wz-border)] p-[18px]">
            {experiences.length > 1 ? (
              <button
                type="button"
                onClick={() => onExperiences(experiences.filter((_, i) => i !== index))}
                aria-label={`გამოცდილება ${index + 1}: წაშლა`}
                className="wz-focus absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[var(--wz-muted)] hover:bg-[var(--wz-hover)]"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:pr-8">
              <Field label="პოზიცია ან პროექტი" htmlFor={`cv-role-${index}`}>
                <input id={`cv-role-${index}`} value={entry.role} onChange={(e) => setEntry(index, "role", e.target.value)} placeholder="მაგ. ვებ დეველოპერი, სტაჟიორი" className="wz-input" />
              </Field>
              <Field label="სად" htmlFor={`cv-place-${index}`}>
                <input id={`cv-place-${index}`} value={entry.place} onChange={(e) => setEntry(index, "place", e.target.value)} placeholder="მაგ. სტარტაპი, უნივერსიტეტის ლაბორატორია" className="wz-input" />
              </Field>
            </div>
            <Field label="რას აკეთებდი" htmlFor={`cv-desc-${index}`}>
              <textarea
                id={`cv-desc-${index}`}
                value={entry.description}
                onChange={(e) => setEntry(index, "description", e.target.value)}
                placeholder="მოკლედ, შენი სიტყვებით: ვაკეთებდი საიტის გვერდებს, ვმუშაობდი გუნდში…"
                className="wz-input min-h-[96px]"
              />
            </Field>
            <p className="flex items-center gap-1.5 text-[13px] text-[var(--wz-text)]">
              <Sparkles className="h-3.5 w-3.5 text-[#e11d74]" aria-hidden />
              AI ამას პროფესიულ პუნქტებად გადააქცევს
            </p>
          </div>
        ))}
        {experiences.length < MAX_EXPERIENCES ? (
          <button
            type="button"
            onClick={() => onExperiences([...experiences, emptyExperience()])}
            className="wz-focus flex h-[52px] items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-[var(--wz-field-border)] text-[14.5px] font-semibold text-[var(--wz-text)] hover:border-[var(--wz-future)]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            კიდევ ერთი გამოცდილება
          </button>
        ) : null}
      </div>
    </StepSection>
  );
}

/* ---------- Step 3 ---------- */

export function SkillsStep({
  tools,
  onTools,
  softSkills,
  onSoftSkills,
  ats,
  internship,
  onToggle,
  language,
  onLanguage,
}: {
  tools: string[];
  onTools: (tools: string[]) => void;
  softSkills: string[];
  onSoftSkills: (skills: string[]) => void;
  ats: boolean;
  internship: boolean;
  onToggle: (key: "ats" | "internship", value: boolean) => void;
  language: CvLanguage;
  onLanguage: (language: CvLanguage) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState("");
  const options = [...SOFT_SKILLS, ...softSkills.filter((skill) => !SOFT_SKILLS.includes(skill))];
  const toggle = (skill: string) =>
    onSoftSkills(softSkills.includes(skill) ? softSkills.filter((item) => item !== skill) : [...softSkills, skill]);
  const addCustom = () => {
    const skill = custom.trim();
    if (skill && !softSkills.includes(skill)) onSoftSkills([...softSkills, skill]);
    setCustom("");
    setAdding(false);
  };

  return (
    <StepSection icon={Wrench} tone={TONES.green} title="უნარები" subtitle="რას იყენებ და რა გამოგარჩევს">
      <Field label="პროგრამები და ხელსაწყოები">
        <TagInput tags={tools} onChange={onTools} label="პროგრამები და ხელსაწყოები" />
      </Field>

      <Field label="პიროვნული უნარები" aside={<span className="text-[13px] text-[var(--wz-faint)]">აირჩიე ან დაწერე შენი</span>}>
        <ChoiceChips
          label="პიროვნული უნარები"
          options={options.map((skill) => ({ value: skill, label: skill }))}
          value={softSkills}
          onChange={toggle}
          trailing={
            adding ? (
              <input
                autoFocus
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  } else if (e.key === "Escape") setAdding(false);
                }}
                onBlur={addCustom}
                aria-label="შენი უნარი"
                placeholder="შენი უნარი"
                className="wz-input !h-10 !w-44 !rounded-full !px-4 !text-[14px]"
              />
            ) : (
              <button type="button" onClick={() => setAdding(true)} className="wz-chip">
                <Plus className="h-[13px] w-[13px]" strokeWidth={3} aria-hidden />
                სხვა
              </button>
            )
          }
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(
          [
            ["ats", "ATS ოპტიმიზაცია", "ავტომატური სისტემებიც კარგად წაიკითხავენ", ats],
            ["internship", "სტაჟირებისთვის მორგება", "აქცენტი სწავლასა და პროექტებზე", internship],
          ] as const
        ).map(([key, title, sub, on]) => (
          <div key={key} className="flex items-center gap-3 rounded-[20px] border border-[var(--wz-border)] p-4">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-[var(--wz-title)]">{title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-[var(--wz-muted)]">{sub}</p>
            </div>
            <Switch checked={on} onChange={(next) => onToggle(key, next)} label={title} />
          </div>
        ))}
      </div>

      <Field label="რა ენაზე იყოს CV">
        <div role="radiogroup" aria-label="რა ენაზე იყოს CV" className="grid h-11 max-w-xs grid-cols-2 rounded-full bg-[var(--wz-soft)] p-1">
          {(
            [
              ["ka", "ქართული"],
              ["en", "English"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={language === id}
              onClick={() => onLanguage(id)}
              className={`wz-focus rounded-full text-[14px] font-semibold transition-colors ${
                language === id ? "bg-[var(--wz-card)] text-[var(--wz-title)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-[var(--wz-muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-[var(--wz-muted)]">ამ ენაზე დაიწერება ტექსტიც და სექციების სათაურებიც.</p>
      </Field>
    </StepSection>
  );
}
