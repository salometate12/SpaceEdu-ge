"use client";

import { FileText, Plus } from "lucide-react";
import type { UploadedPhoto } from "@/lib/presentation-photos";
import { PRESENTATION_LEVELS } from "@/lib/presentation-constants";
import { StepSection, TONES } from "@/components/ui/wizard/StepSection";
import { ChoiceChips, Field } from "@/components/ui/wizard/fields";
import { PhotoUploader } from "./PhotoUploader";
import type { PresentationForm } from "./PresentationWizard";

interface Step1InfoProps {
  form: PresentationForm;
  onChange: (next: Partial<PresentationForm>) => void;
  photos: UploadedPhoto[];
  onPhotosChange: (photos: UploadedPhoto[]) => void;
}

export const SLIDE_COUNTS = [5, 8, 10, 12, 15];

export const LANGUAGES = [
  { value: "ქართული", label: "ქართული" },
  { value: "ინგლისური", label: "English" },
  { value: "ქართული + ინგლისური", label: "ორივე" },
];

/** Each quick chip adds one sentence to the instructions. */
export const QUICK_INSTRUCTIONS = [
  { label: "სტატისტიკა", phrase: "დაამატე სტატისტიკა და რიცხვები." },
  { label: "მოკლედ", phrase: "ტექსტი იყოს მოკლე, სლაიდზე მაქსიმუმ სამი პუნქტი." },
  { label: "მაგალითები", phrase: "თითო თემაზე მოიყვანე მაგალითი." },
  { label: "აკადემიური", phrase: "დაწერე აკადემიური სტილით და ბოლოს მიუთითე წყაროები." },
];

/** The instructions with `phrase` added on a new line (once). */
export function withPhrase(text: string, phrase: string): string {
  if (text.includes(phrase)) return text;
  return text.trim() ? `${text.trim()}\n${phrase}` : phrase;
}

export function Step1Info({ form, onChange, photos, onPhotosChange }: Step1InfoProps) {
  return (
    <StepSection icon={FileText} tone={TONES.orange} title="ინფორმაცია" subtitle="რაზეა პრეზენტაცია">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="თემა" htmlFor="pr-topic">
          <input id="pr-topic" value={form.topic} onChange={(e) => onChange({ topic: e.target.value })} placeholder="მაგ. ფოტოსინთეზი" className="wz-input" />
        </Field>
        <Field label="საგანი" htmlFor="pr-subject">
          <input id="pr-subject" value={form.subject} onChange={(e) => onChange({ subject: e.target.value })} placeholder="მაგ. ბიოლოგია" className="wz-input" />
        </Field>
      </div>

      <Field label="სლაიდების რაოდენობა">
        <ChoiceChips
          label="სლაიდების რაოდენობა"
          options={SLIDE_COUNTS.map((count) => ({ value: count, label: String(count) }))}
          value={form.slideCount}
          onChange={(slideCount) => onChange({ slideCount })}
        />
      </Field>

      <Field label="დონე">
        <ChoiceChips label="დონე" options={PRESENTATION_LEVELS.map((level) => ({ value: level, label: level }))} value={form.level} onChange={(level) => onChange({ level })} />
      </Field>

      <Field label="ენა">
        <ChoiceChips label="ენა" options={LANGUAGES} value={form.language} onChange={(language) => onChange({ language })} />
      </Field>

      <Field label="ფოტოები" optional>
        <PhotoUploader photos={photos} onChange={onPhotosChange} />
      </Field>

      <Field label="დამატებითი მითითებები" optional htmlFor="pr-extra">
        <textarea
          id="pr-extra"
          value={form.extraInstructions}
          onChange={(e) => onChange({ extraInstructions: e.target.value })}
          placeholder="მაგ. ბოლოს დაამატე შეჯამება და წყაროები"
          className="wz-input min-h-[84px]"
        />
        <div className="flex flex-wrap gap-2">
          {QUICK_INSTRUCTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onChange({ extraInstructions: withPhrase(form.extraInstructions, item.phrase) })}
              className="wz-chip wz-chip--quick"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
      </Field>
    </StepSection>
  );
}
